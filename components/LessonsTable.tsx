"use client";

import type { Lesson } from "@/lib/types/lesson";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export default function LessonsTable({ lessons }: { lessons: Lesson[] }) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Lessons</h2>
      </div>
      <div className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-medium">Title</TableHead>
              <TableHead className="font-medium">Status</TableHead>
              <TableHead className="font-medium">Created</TableHead>
              <TableHead className="font-medium">View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lessons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                  No lessons yet. Create your first lesson above!
                </TableCell>
              </TableRow>
            ) : (
              lessons.map((lesson) => (
                <TableRow key={lesson.id}>
                  <TableCell>
                    <div className="font-medium text-gray-900">{lesson.title}</div>
                    {lesson.outline && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {lesson.outline.slice(0, 100)}...
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {lesson.status === "generating" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 animate-pulse">
                        Generating...
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Generated
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(lesson.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                  {lesson.status === "generated" ? <Link href={`/lessons/${lesson.id}`} className="text-blue-500 hover:text-blue-700">View</Link> : <span className="text-gray-500">N/A</span>}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
