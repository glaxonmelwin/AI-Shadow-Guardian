import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useState } from "react";
import { ChevronDown, ChevronUp, MessageSquare, UserPlus } from "lucide-react";

export default function IncidentsPage() {
  const incidents = useQuery(api.incidents.list, { limit: 100 });
  const updateStatus = useMutation(api.incidents.updateStatus);
  const addNote = useMutation(api.incidents.addNote);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const handleStatus = async (id: string, status: "investigating" | "resolved" | "false_positive") => {
    try {
      await updateStatus({ id: id as any, status });
      toast.success("Incident updated");
    } catch { toast.error("Failed"); }
  };

  const handleAddNote = async (id: string) => {
    if (!noteText.trim()) return;
    try {
      await addNote({ id: id as any, content: noteText, author: "Manager" });
      setNoteText("");
      toast.success("Note added");
    } catch { toast.error("Failed"); }
  };

  return (
    <DashboardLayout role="manager">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Incidents</h1>
          <p className="text-sm text-muted-foreground">Security incidents requiring investigation and resolution.</p>
        </div>

        {/* Summary Cards */}
        {incidents && (
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            {[
              { label: "Open", value: incidents.filter(i => i.status === "open").length, color: "text-destructive" },
              { label: "Investigating", value: incidents.filter(i => i.status === "investigating").length, color: "text-chart-2" },
              { label: "Resolved", value: incidents.filter(i => i.status === "resolved").length, color: "text-chart-1" },
              { label: "False Positive", value: incidents.filter(i => i.status === "false_positive").length, color: "text-muted-foreground" },
            ].map(({ label, value, color }) => (
              <Card key={label} className="border-border/60 bg-card/80">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {!incidents ? (
            <Card className="border-border/60 bg-card/80"><CardContent className="py-8 text-center text-sm text-muted-foreground">Loading...</CardContent></Card>
          ) : incidents.length === 0 ? (
            <Card className="border-border/60 bg-card/80"><CardContent className="py-8 text-center text-sm text-muted-foreground">No incidents recorded.</CardContent></Card>
          ) : incidents.map(inc => {
            const isExpanded = expandedId === inc._id;
            return (
              <motion.div key={inc._id} layout>
                <Card className="border-border/60 bg-card/80">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={inc.severity === "critical" ? "destructive" : inc.severity === "high" ? "destructive" : "outline"} className="text-[10px]">
                            {inc.severity.toUpperCase()}
                          </Badge>
                          <Badge variant={inc.status === "resolved" || inc.status === "false_positive" ? "secondary" : "default"} className="text-[10px]">
                            {inc.status.replace(/_/g, " ").toUpperCase()}
                          </Badge>
                          {inc.notes.length > 0 && (
                            <Badge variant="outline" className="text-[10px]">
                              <MessageSquare className="mr-1 h-3 w-3" />{inc.notes.length}
                            </Badge>
                          )}
                        </div>
                        <h3 className="mt-1 font-semibold tracking-tight">{inc.title}</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">{inc.description}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {inc.employeeName} • Created {new Date(inc.createdAt).toLocaleString()}
                          {inc.resolvedAt && ` • Resolved ${new Date(inc.resolvedAt).toLocaleString()}`}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        {inc.status === "open" && (
                          <Button size="sm" variant="outline" onClick={() => handleStatus(inc._id, "investigating")} className="cursor-pointer text-xs h-7">
                            Investigate
                          </Button>
                        )}
                        {(inc.status === "open" || inc.status === "investigating") && (
                          <>
                            <Button size="sm" onClick={() => handleStatus(inc._id, "resolved")} className="cursor-pointer text-xs h-7">
                              Resolve
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleStatus(inc._id, "false_positive")} className="cursor-pointer text-xs h-7">
                              False Positive
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setExpandedId(isExpanded ? null : inc._id)} className="cursor-pointer text-xs h-7">
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          Notes
                        </Button>
                      </div>
                    </div>

                    {/* Expandable Notes Section */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 border-t border-border/40 pt-3">
                            {inc.notes.length > 0 && (
                              <div className="space-y-2 mb-3">
                                {inc.notes.map((note, i) => (
                                  <div key={i} className="rounded bg-muted/50 p-2 text-xs">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium">{note.author}</span>
                                      <span className="text-muted-foreground">{new Date(note.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p className="text-muted-foreground">{note.content}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Textarea
                                placeholder="Add a note..."
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                className="min-h-[60px] text-sm"
                              />
                              <Button size="sm" onClick={() => handleAddNote(inc._id)} disabled={!noteText.trim()} className="cursor-pointer self-end">
                                Add
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
