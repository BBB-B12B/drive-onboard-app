import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/logo";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-headline">ยินดีต้อนรับ</CardTitle>
          <CardDescription>เลือกระบบที่ต้องการใช้งาน</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full" size="lg">
            <Link href="/apply">
              ลงทะเบียนสมัครงาน (Register)
            </Link>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">สำหรับเจ้าหน้าที่</span>
            </div>
          </div>

          <Button asChild variant="outline" className="w-full" size="lg">
            <Link href="/login">
              เข้าสู่ระบบ (Login)
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
