"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import LessonsTable from "@/components/LessonsTable";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Lesson } from "@/lib/types/lesson";

export default function HomePage() {
  const [lessons, setLessons] = useState< null | Lesson[]>(null);
  const [outline, setOutline] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Load initial lessons
  useEffect(() => {
    const loadLessons = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("lessons")
        .select("id, title, outline, status, created_at")
        .order("created_at", { ascending: false });
      setLessons(data || []);
    };
    loadLessons();
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("public:lessons")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "lessons",
        },
        (payload) => {
          console.log("Lesson status updated:", payload.new);
          setLessons((prev: Lesson[] | null) => {
            const existing = prev?.find((l: Lesson) => l.id === payload.new.id);
            if (existing) {
              return prev?.map((l: Lesson) =>
                l.id === payload.new.id ? payload.new as Lesson : l
              ) || [];
            }
            return [payload.new as Lesson, ...(prev || [])];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleGenerateLesson = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!outline.trim()) {
      setError("Please enter a lesson outline");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/lessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ outline: outline.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create lesson");
      }

      const data = await response.json();
      setLessons((prev) => [data as Lesson, ...(prev || [])]);
      console.log("Lesson created:", data);
      
      // Clear the form
      setOutline("");
    } catch (error) {
      console.error("Error creating lesson:", error);
      setError(error instanceof Error ? error.message : "An error occurred while creating the lesson");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Generate Lessons</h1>

      {/* Form for new lesson outline */}
      <form onSubmit={handleGenerateLesson} className="mb-6">
        <div className="mb-4">
          <Textarea
            name="outline"
            value={outline}
            onChange={(e) => setOutline(e.target.value)}
            minLength={20}
            placeholder="Enter your lesson outline here..."
            className="min-h-[120px] resize-vertical"
            disabled={isLoading}
          />
          {error && (
            <p className="text-red-600 text-sm mt-2">{error}</p>
          )}
        </div>
        <div className="flex justify-center">
        <Button
          type="submit"
          disabled={!outline.trim() || isLoading}
          variant={!outline.trim() || isLoading ? "secondary" : "default"}
        >
          Generate
        </Button>
        </div>
      </form>

      {/* Lessons table */}
      {lessons ? <LessonsTable lessons={lessons} /> : <p>Loading...</p>}
    </div>
  );
}
