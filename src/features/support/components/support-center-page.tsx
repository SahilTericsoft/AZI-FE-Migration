"use client";

import { useEffect, useState } from "react";

import { FileText, SquareArrowOutUpRight } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";

import { useHelpSections } from "../support.queries";
import type { HelpSection } from "../support.types";

export default function SupportCenterPage() {
  const { data: sections = [], isLoading, isError, error } = useHelpSections();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (selectedId == null && sections.length > 0) setSelectedId(sections[0].id);
  }, [sections, selectedId]);

  const selected = sections.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="shadcn-scope flex flex-col gap-4 text-foreground">
      <h2 className="text-2xl font-bold">Support Center</h2>

      <Card className="p-0">
        <Tabs defaultValue="manuals">
          <TabsList className="w-full px-2">
            <TabsTrigger value="manuals">MANUALS</TabsTrigger>
            <TabsTrigger value="faqs" disabled>
              FAQS
            </TabsTrigger>
          </TabsList>

          <div className="p-6">
            <TabsContent value="faqs" className="mt-0">
              <Alert>FAQ Coming Soon</Alert>
            </TabsContent>
            <TabsContent value="manuals" className="mt-0">
              {isLoading ? (
                <div className="grid place-items-center py-12">
                  <Spinner />
                </div>
              ) : isError ? (
                <Alert variant="destructive">
                  {error?.message ?? "Failed to load help sections."}
                </Alert>
              ) : sections.length === 0 ? (
                <p className="text-muted-foreground">No manuals available yet.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[300px_1fr]">
                  <Card className="overflow-hidden p-1">
                    {sections.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedId(s.id)}
                        className={cn(
                          "w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted",
                          s.id === selectedId && "bg-primary/10 font-medium text-primary",
                        )}
                      >
                        {`${s.sequence ?? ""}. ${s.title ?? ""}`.trim()}
                      </button>
                    ))}
                  </Card>
                  <SectionDetails section={selected} />
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}

function SectionDetails({ section }: { section: HelpSection | null }) {
  if (!section) return <p className="text-muted-foreground">Select a section.</p>;
  const attachments = section.attachments ?? [];
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-base font-bold">
          {section.sequence}. {section.title}
        </h3>
        {section.description && (
          <p className="mt-0.5 text-muted-foreground">{section.description}</p>
        )}
      </div>
      <div className="h-px bg-border" />
      <p className="text-sm font-bold">Articles</p>
      {attachments.length === 0 ? (
        <Alert variant="destructive">No article available for this section.</Alert>
      ) : (
        <div className="flex flex-col gap-2">
          {attachments.map((a, i) => {
            const link = a.secureUrl ?? a.url ?? undefined;
            const meta = [a.attachmentType, a.mimeType, a.size].filter(Boolean).join(" · ");
            return (
              <Card key={a.id ?? i} className="flex items-center gap-3 p-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{a.title ?? "Document"}</p>
                  {a.description && <p className="text-sm text-muted-foreground">{a.description}</p>}
                  {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
                </div>
                {link && (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
                  >
                    Open <SquareArrowOutUpRight className="h-4 w-4" />
                  </a>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
