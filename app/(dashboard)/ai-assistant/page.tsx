import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatInterface } from '@/components/ai/chat-interface';
import { Bot } from 'lucide-react';

export default function AIAssistantPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-full">
          <Bot className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trợ lý AI</h1>
          <p className="text-muted-foreground">
            Hỏi đáp thông tin kinh doanh bằng tiếng Việt tự nhiên
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trợ lý AI Phúc Lợi</CardTitle>
          <CardDescription>
            Tra cứu công nợ, doanh thu, tồn kho và nhiều thông tin khác
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChatInterface />
        </CardContent>
      </Card>
    </div>
  );
}
