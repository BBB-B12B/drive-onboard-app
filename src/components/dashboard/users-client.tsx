"use client";

import { useState, useTransition } from "react";
import type { User } from "@/lib/types";
import { UsersTable } from "./users-table";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserForm } from "./user-form";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import * as z from "zod";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";


// This can be inferred from the form schema in UserForm, but defining it here is fine too.
const formSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["admin", "employee"]),
  phone: z.string().optional(),
  password: z.string().min(6),
});


interface UsersClientProps {
  data: User[];
}

export function UsersClient({ data }: UsersClientProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handleCreateUser = async (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          throw new Error('Failed to create user');
        }

        toast({
          title: "สำเร็จ",
          description: "สมาชิกใหม่ถูกสร้างขึ้นเรียบร้อยแล้ว",
        });
        setIsCreateDialogOpen(false);
        router.refresh();
      } catch (error) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถสร้างสมาชิกใหม่ได้",
          variant: "destructive",
        });
      }
    });
  };

  const handleUpdateUser = async (values: z.infer<typeof formSchema>) => {
    if (!selectedUser) return;

    startTransition(async () => {
      try {
        const response = await fetch(`/api/users/${selectedUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          throw new Error('Failed to update user');
        }

        toast({
          title: "สำเร็จ",
          description: "ข้อมูลสมาชิกถูกอัปเดตเรียบร้อยแล้ว",
        });
        setIsEditDialogOpen(false);
        setSelectedUser(null);
        router.refresh();
      } catch (error) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถอัปเดตข้อมูลสมาชิกได้",
          variant: "destructive",
        });
      }
    });
  };

  const handleOpenDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    startTransition(async () => {
      try {
        const response = await fetch(`/api/users/${selectedUser.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete user');
        }

        toast({
          title: "สำเร็จ",
          description: "สมาชิกถูกลบเรียบร้อยแล้ว",
        });
        setIsDeleteDialogOpen(false);
        setSelectedUser(null);
        router.refresh();
      } catch (error) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถลบสมาชิกได้",
          variant: "destructive",
        });
      }
    });
  };
  
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">จัดการสมาชิก</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              เพิ่มสมาชิกใหม่
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>เพิ่มสมาชิกใหม่</DialogTitle>
            </DialogHeader>
            <UserForm onSubmit={handleCreateUser} isPending={isPending} />
          </DialogContent>
        </Dialog>
      </div>
      <UsersTable data={data} onEdit={handleEditUser} onDelete={handleOpenDeleteDialog} />

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลสมาชิก</DialogTitle>
          </DialogHeader>
          <UserForm
            user={selectedUser!}
            onSubmit={handleUpdateUser}
            isPending={isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้{" "}
              <span className="font-semibold">{selectedUser?.name}</span>?
              การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className={cn(buttonVariants({ variant: "destructive" }))}
              disabled={isPending}
            >
              {isPending ? "กำลังลบ..." : "ลบ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
