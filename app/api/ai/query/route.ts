import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { SYSTEM_PROMPT, generateQueryContext } from '@/lib/ai/prompts';
import { processQuery } from '@/lib/ai/query-processor';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Câu hỏi không hợp lệ' },
        { status: 400 }
      );
    }

    // Process the query to get relevant data
    const queryResult = await processQuery(query);

    // Generate context with the data
    const dataContext = generateQueryContext(queryResult.data);

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `${query}\n\n${dataContext}`,
        },
      ],
    });

    // Extract the response text
    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    // Save to chat history
    await db.chatHistory.create({
      data: {
        userId: session.user.id,
        query,
        response: responseText,
        metadata: {
          intent: queryResult.intent,
          model: 'claude-3-haiku-20240307',
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        response: responseText,
        intent: queryResult.intent,
      },
    });
  } catch (error) {
    console.error('AI Query Error:', error);

    // Handle specific error types
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { success: false, error: 'Lỗi kết nối AI. Vui lòng thử lại.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Không thể xử lý câu hỏi. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
