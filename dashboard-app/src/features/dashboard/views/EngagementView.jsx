import * as React from "react";
import { Check, Loader2, MessageSquare, Send } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/lib/api";
import { getRiskTrend, listFeedback, resolveFeedback } from "@/lib/resources";
import { useAsync } from "@/lib/use-async";
import { formatDateTime } from "@/lib/format";
import { PageHeader, SectionHeader } from "@/components/page-header";
import { ChartCard, ChartFrame, ChartTooltip, axisTick, gridProps } from "@/components/chart";
import { EmptyState, ErrorState, LoadingBlock, LoadingChart } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function AdminFeedbackQueue() {
  const feedback = useAsync(listFeedback);
  const [busy, setBusy] = React.useState(null);
  const rows = feedback.data || [];

  async function resolve(item) {
    setBusy(item._id);
    try {
      await resolveFeedback(item._id);
      toast.success("Feedback marked resolved.");
      feedback.refresh();
    } catch (error) {
      toast.error(error.message || "Couldn't resolve feedback.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Administration"
        title="Feedback queue"
        description="Review feedback submitted by users and mark resolved items."
      />
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader
            title="Open feedback"
            description={`${rows.length} open ${rows.length === 1 ? "item" : "items"}`}
            actions={<MessageSquare className="size-3.5 text-muted-foreground" />}
          />
        </CardHeader>
        <CardContent className="pt-0">
          {feedback.loading ? <LoadingBlock label="Loading feedback…" /> : null}
          {feedback.status === "error" ? <ErrorState message={feedback.error} onRetry={feedback.refresh} /> : null}
          {!feedback.loading && feedback.status !== "error" && rows.length === 0 ? (
            <EmptyState title="Queue is clear" description="New submissions will appear here." className="py-8" />
          ) : null}
          {rows.length > 0 ? (
            <ul className="divide-y divide-border/50">
              {rows.map((item) => (
                <li key={item._id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{item.username}</span>
                      <Badge variant="outline" className="capitalize">{item.category}</Badge>
                      <span className="text-[0.6875rem] text-muted-foreground">
                        {item.role} · {formatDateTime(item.created_at)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.message}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    disabled={busy === item._id}
                    onClick={() => resolve(item)}
                  >
                    {busy === item._id ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                    Resolve
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export function AnalyticsTrend() {
  const trend = useAsync(getRiskTrend);
  const rows = trend.data || [];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Analysis"
        title="Risk trend"
        description="High-risk rate across sequential student record cohorts."
      />
      <ChartCard title="High-risk rate by cohort" description="Each point represents a group of up to 100 records">
        {trend.loading ? <LoadingChart height={300} /> : null}
        {trend.status === "error" ? <ErrorState message={trend.error} onRetry={trend.refresh} /> : null}
        {!trend.loading && trend.status !== "error" && rows.length === 0 ? (
          <EmptyState title="No trend data yet" description="Add student records to see the cohort trend." className="py-10" />
        ) : null}
        {rows.length > 0 ? (
          <ChartFrame height={300}>
            <LineChart data={rows} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="cohort" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis
                domain={[0, 1]}
                tickFormatter={(value) => `${Math.round(value * 100)}%`}
                tick={axisTick}
                axisLine={false}
                tickLine={false}
              />
              <ChartTooltip formatter={(value) => `${Math.round(value * 100)}%`} />
              <Line
                type="monotone"
                dataKey="high_risk_rate"
                name="High-risk rate"
                stroke="var(--chart-3)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--chart-3)" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ChartFrame>
        ) : null}
      </ChartCard>
    </div>
  );
}

export function InAppMessages({ user }) {
  const [conversations, setConversations] = React.useState([]);
  const [activeUser, setActiveUser] = React.useState("");
  const [recipient, setRecipient] = React.useState("");
  const [messages, setMessages] = React.useState([]);
  const [text, setText] = React.useState("");
  const [loadingConversations, setLoadingConversations] = React.useState(true);
  const [loadingMessages, setLoadingMessages] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState(null);

  const loadConversations = React.useCallback(async () => {
    const data = await apiGet("/messages/conversations");
    setConversations(data.conversations || []);
  }, []);

  React.useEffect(() => {
    let active = true;
    apiGet("/messages/conversations")
      .then((data) => {
        if (active) setConversations(data.conversations || []);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Couldn't load conversations.");
      })
      .finally(() => {
        if (active) setLoadingConversations(false);
      });
    return () => { active = false; };
  }, []);

  React.useEffect(() => {
    if (!activeUser) {
      setMessages([]);
      return undefined;
    }
    let active = true;
    setLoadingMessages(true);
    setError(null);
    apiGet(`/messages/${encodeURIComponent(activeUser)}`)
      .then((data) => {
        if (active) setMessages(data.messages || []);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Couldn't load this conversation.");
      })
      .finally(() => {
        if (active) setLoadingMessages(false);
      });
    return () => { active = false; };
  }, [activeUser]);

  async function sendMessage(event) {
    event.preventDefault();
    const target = activeUser || recipient.trim();
    if (!target || !text.trim()) return;

    setSending(true);
    try {
      await apiPost("/messages", { recipient: target, text: text.trim() });
    } catch (sendError) {
      toast.error(sendError.message || "Couldn't send the message.");
      setSending(false);
      return;
    }
    setSending(false);
    setActiveUser(target);
    setRecipient("");
    setText("");
    setError(null);
    toast.success("Message sent.");
    Promise.all([
      loadConversations(),
      apiGet(`/messages/${encodeURIComponent(target)}`),
    ])
      .then(([, data]) => setMessages(data.messages || []))
      .catch((loadError) => setError(loadError.message || "Message sent, but the conversation could not refresh."));
  }

  function openRecipient(event) {
    event.preventDefault();
    if (recipient.trim()) {
      setActiveUser(recipient.trim());
      setRecipient("");
    }
  }

  async function retryLoad() {
    setError(null);
    try {
      if (activeUser) {
        setLoadingMessages(true);
        const data = await apiGet(`/messages/${encodeURIComponent(activeUser)}`);
        setMessages(data.messages || []);
      } else {
        setLoadingConversations(true);
        await loadConversations();
      }
    } catch (loadError) {
      setError(loadError.message || "Couldn't refresh messages.");
    } finally {
      setLoadingMessages(false);
      setLoadingConversations(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Workspace" title="Messages" description="Direct in-app messages with your school community." />
      <div className="grid gap-3 lg:grid-cols-[minmax(14rem,0.7fr)_1.3fr]">
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader title="Conversations" description="Recent direct messages" />
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <form onSubmit={openRecipient} className="flex gap-2">
              <Input
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                placeholder="Username"
                aria-label="Start a conversation by username"
              />
              <Button type="submit" variant="outline" size="sm">Open</Button>
            </form>
            {loadingConversations ? <LoadingBlock label="Loading conversations…" /> : null}
            {!loadingConversations && conversations.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">No conversations yet. Enter a username to start one.</p>
            ) : null}
            <ul className="divide-y divide-border/50">
              {conversations.map((message) => {
                const other = message.sender === user.username ? message.recipient : message.sender;
                return (
                  <li key={other}>
                    <button
                      type="button"
                      onClick={() => setActiveUser(other)}
                      className={`w-full rounded-md px-2.5 py-3 text-left transition-colors hover:bg-accent/60 ${activeUser === other ? "bg-accent/60" : ""}`}
                    >
                      <span className="block truncate text-sm font-medium">{other}</span>
                      <span className="block truncate text-xs text-muted-foreground">{message.text}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <Card className="flex min-h-[28rem] flex-col">
          <CardHeader className="border-b border-border/50 pb-3">
            <SectionHeader title={activeUser || "Select a conversation"} description={activeUser ? "Direct message" : "Choose a recent conversation or start one by username"} />
          </CardHeader>
          {error ? <div className="px-5 pt-4"><ErrorState message={error} onRetry={retryLoad} /></div> : null}
          <CardContent className="flex flex-1 flex-col pt-4">
            <div className="flex-1 space-y-3 overflow-y-auto">
              {loadingMessages ? <LoadingBlock label="Loading messages…" /> : null}
              {!loadingMessages && activeUser && messages.length === 0 && !error ? (
                <EmptyState title="No messages yet" description={`Start the conversation with ${activeUser}.`} className="py-8" />
              ) : null}
              {messages.map((message, index) => (
                <div key={`${message.created_at}-${index}`} className={`flex ${message.sender === user.username ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 ${message.sender === user.username ? "bg-primary text-primary-foreground" : "bg-accent"}`}>
                    <p className="whitespace-pre-wrap break-words text-sm">{message.text}</p>
                    <time className={`mt-1 block text-[0.625rem] ${message.sender === user.username ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {formatDateTime(message.created_at)}
                    </time>
                  </div>
                </div>
              ))}
            </div>
            {activeUser ? (
              <form onSubmit={sendMessage} className="mt-4 flex items-end gap-2 border-t border-border/50 pt-4">
                <Textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Write a message…"
                  aria-label="Message"
                  rows={2}
                  maxLength={2000}
                  className="resize-none"
                />
                <Button type="submit" size="icon" aria-label="Send message" disabled={sending || !text.trim()}>
                  {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </Button>
              </form>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
