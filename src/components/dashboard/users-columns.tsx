"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { User } from "@/lib/types";
import { MoreHorizontal, UserCog, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface GetColumnsProps {
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export const getColumns = ({ onEdit, onDelete }: GetColumnsProps): ColumnDef<User>[] => [
  {
    accessorKey: "name",
    header: "ชื่อ-สกุล",
  },
  {
    accessorKey: "email",
    header: "อีเมล",
  },
  {
    accessorKey: "role",
    header: "สิทธิ์",
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      const variant = role === "admin" ? "default" : "secondary";
      return <Badge variant={variant}>{role}</Badge>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">เปิดเมนู</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(user.id)}
              >
                คัดลอก ID
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(user)}>
                <UserCog className="mr-2 h-4 w-4" />
                แก้ไขข้อมูล
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(user)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                ลบผู้ใช้
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
