import * as React from "react";
import { Loader2, MessageSquarePlus, Send } from "lucide-react";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function FeedbackDock() {
  const [open, setOpen] = React.useState(false);
  const [category, setCategory] = React.useState("feedback");
  const [message, setMessage] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("ep:open-feedback", handler);
    return () => window.removeEventListener("ep:open-feedback", handler);
  }, []);

  async function submit() {
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      await apiPost("/feedback", { category, message });
      toast.success("Feedback sent — thank you.");
      setMessage("");
      setOpen(false);
    } catch (err) {
      toast.error(err.message || "Couldn't send feedback. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-4 z-30 flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition-transform hover:-translate-y-0.5 hover:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-ring/35 focus-visible:outline-none sm:right-6 sm:bottom-6"
        aria-label="Send feedback"
      >
        <MessageSquarePlus className="size-5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Feedback &amp; support</DialogTitle>
            <DialogDescription>
              Tell us what's working, what isn't, or ask for help.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="feedback-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="feedback-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feedback">General feedback</SelectItem>
                  <SelectItem value="bug">Report an issue</SelectItem>
                  <SelectItem value="question">Ask for help</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="feedback-message">Message</Label>
              <Textarea
                id="feedback-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what's up…"
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={submitting || !message.trim()}>
              {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
