"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import "./discussions.css";

type TenantType = "UNIVERSITY" | "SKILL_ACADEMY" | "CORPORATE" | "NGO" | "GOVERNMENT";
type RoleKey = "SUPER_ADMIN" | "PLATFORM_ADMIN" | "TENANT_ADMIN" | "COORDINATOR" | "MANAGER" | "FACULTY" | "TRAINER" | "STUDENT" | "LEARNER" | "EMPLOYEE" | "OFFICER" | "VOLUNTEER" | "MEMBER";
type PostType = "QUESTION" | "DISCUSSION" | "POLL" | "RESOURCE";
type SortKey = "LATEST" | "TRENDING" | "UNANSWERED" | "MOST_DISCUSSSED";
type StatusKey = "ALL" | "OPEN" | "ANSWERED" | "SOLVED" | "UNANSWERED";
type Screen = "HOME" | "DETAIL" | "NOTIFICATIONS";
type CreateStep = 1 | 2 | 3 | 4;

type LoginContext = { role?: string; displayRole?: string; tenantType?: string; displayTenant?: string };
type ScopeOption = { id: string; label: string; type: "TENANT" | "DEPARTMENT" | "PROGRAMME" | "COURSE" | "BATCH" | "GROUP" };
type Community = { id: string; name: string; icon: string; scopes: ScopeOption[] };
type ReplyComment = { id: number; author: string; body: string; time: string };
type Reply = { id: number; author: string; role: string; body: string; time: string; likes: number; accepted?: boolean; comments: ReplyComment[] };
type PollOption = { id: number; text: string; votes: number };
type Post = {
  id: number; tenant: TenantType; type: PostType; title: string; body: string; author: string; authorRole: string;
  communityId: string; communityName: string; scopeId: string; scopeLabel: string; tags: string[]; createdAt: number;
  views: number; reactions: Record<string, number>; replies: Reply[]; status: "OPEN" | "ANSWERED" | "SOLVED" | "CLOSED";
  attachmentName?: string; resourceUrl?: string; following?: boolean; bookmarked?: boolean;
  poll?: { options: PollOption[]; votedOptionIds: number[]; multiple: boolean; showResultsAfterVote: boolean; allowComments: boolean };
};
type NotificationItem = { id: number; type: "REPLY" | "MENTION" | "ACCEPTED" | "POLL" | "FOLLOWED" | "MODERATION"; title: string; message: string; time: string; read: boolean; postId?: number };
type ReportTarget = { kind: "POST" | "REPLY"; id: number; title: string };
type CreateDraft = {
  type: PostType | null; title: string; description: string; tags: string; communityId: string; scopeId: string;
  attachmentName: string; resourceUrl: string; pollQuestion: string; pollOptions: string[]; pollMultiple: boolean;
  pollShowResults: boolean; pollAllowComments: boolean;
};

const REACTIONS = ["👍", "❤️", "👏", "💡", "🎉", "😂"];
const TYPE_OPTIONS = [
  { type: "QUESTION" as PostType, title: "Ask a Question", text: "Get help from the community", icon: "❓" },
  { type: "DISCUSSION" as PostType, title: "Start a Discussion", text: "Share ideas and thoughts", icon: "💬" },
  { type: "POLL" as PostType, title: "Create a Poll", text: "Collect opinions", icon: "📊" },
  { type: "RESOURCE" as PostType, title: "Share a Resource", text: "Share useful resources", icon: "📚" },
];
const POST_LABELS: Record<PostType, { label: string; icon: string; color: string }> = {
  QUESTION: { label: "Question", icon: "❓", color: "blue" },
  DISCUSSION: { label: "Discussion", icon: "💬", color: "green" },
  POLL: { label: "Poll", icon: "📊", color: "purple" },
  RESOURCE: { label: "Resource", icon: "📚", color: "orange" },
};
const REPORT_REASONS = ["Spam", "Harassment", "Inappropriate Content", "Misinformation", "Off Topic", "Copyright", "Other"];

const TENANT_COMMUNITIES: Record<TenantType, Community[]> = {
  UNIVERSITY: [
    { id: "uni-general", name: "General", icon: "🏛️", scopes: [
      { id: "uni-all", label: "Entire College / University", type: "TENANT" },
      { id: "eng-dept", label: "Engineering Department", type: "DEPARTMENT" },
      { id: "cse-dept", label: "Computer Science Department", type: "DEPARTMENT" },
    ]},
    { id: "data-engineering", name: "Data Engineering", icon: "🗄️", scopes: [
      { id: "de-course", label: "Google Cloud Data Engineering", type: "COURSE" },
      { id: "de-batch-a", label: "Batch 2026-A", type: "BATCH" },
      { id: "de-batch-b", label: "Batch 2026-B", type: "BATCH" },
    ]},
    { id: "computer-science", name: "Computer Science", icon: "💻", scopes: [
      { id: "cse-dept", label: "Computer Science Department", type: "DEPARTMENT" },
      { id: "ds-course", label: "Data Structures Course", type: "COURSE" },
      { id: "cse-2026", label: "CSE 2026 Cohort", type: "BATCH" },
    ]},
    { id: "placement", name: "Placement Preparation", icon: "🎯", scopes: [
      { id: "placement-all", label: "All Eligible Students", type: "GROUP" },
      { id: "placement-2026", label: "2026 Placement Batch", type: "BATCH" },
    ]},
  ],
  SKILL_ACADEMY: [
    { id: "academy-general", name: "Academy Community", icon: "🎓", scopes: [
      { id: "academy-all", label: "Entire Skill Academy", type: "TENANT" },
      { id: "fullstack-programme", label: "Full Stack Programme", type: "PROGRAMME" },
    ]},
    { id: "full-stack", name: "Full Stack Development", icon: "🧑‍💻", scopes: [
      { id: "fs-cohort-01", label: "Cohort FS-01", type: "BATCH" },
      { id: "fs-cohort-02", label: "Cohort FS-02", type: "BATCH" },
      { id: "react-group", label: "React Practice Group", type: "GROUP" },
    ]},
    { id: "cloud-track", name: "Cloud Certification", icon: "☁️", scopes: [
      { id: "cloud-programme", label: "Cloud Certification Programme", type: "PROGRAMME" },
      { id: "aws-cohort", label: "AWS Cohort", type: "BATCH" },
    ]},
  ],
  CORPORATE: [
    { id: "company-general", name: "Company Community", icon: "🏢", scopes: [
      { id: "company-all", label: "Entire Organization", type: "TENANT" },
      { id: "engineering-unit", label: "Engineering Business Unit", type: "DEPARTMENT" },
    ]},
    { id: "learning-development", name: "Learning & Development", icon: "📘", scopes: [
      { id: "leadership-programme", label: "Leadership Programme", type: "PROGRAMME" },
      { id: "new-joiners", label: "New Joiners Cohort", type: "GROUP" },
    ]},
    { id: "engineering-community", name: "Engineering", icon: "⚙️", scopes: [
      { id: "engineering-unit", label: "Engineering Business Unit", type: "DEPARTMENT" },
      { id: "frontend-team", label: "Frontend Employees", type: "GROUP" },
      { id: "backend-team", label: "Backend Employees", type: "GROUP" },
    ]},
  ],
  NGO: [
    { id: "ngo-general", name: "Organization Community", icon: "🤝", scopes: [
      { id: "ngo-all", label: "Entire NGO", type: "TENANT" },
      { id: "volunteer-group", label: "Volunteer Group", type: "GROUP" },
    ]},
    { id: "skills-programme", name: "Skills Programme", icon: "🧩", scopes: [
      { id: "skills-programme-all", label: "Skills Programme", type: "PROGRAMME" },
      { id: "field-cohort", label: "Field Cohort", type: "BATCH" },
    ]},
  ],
  GOVERNMENT: [
    { id: "gov-general", name: "Department Community", icon: "🏛️", scopes: [
      { id: "gov-all", label: "Entire Department", type: "TENANT" },
      { id: "digital-services", label: "Digital Services Department", type: "DEPARTMENT" },
    ]},
    { id: "officer-training", name: "Officer Training", icon: "📋", scopes: [
      { id: "officer-programme", label: "Officer Training Programme", type: "PROGRAMME" },
      { id: "officer-cohort", label: "Officer Cohort 2026", type: "BATCH" },
    ]},
  ],
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 1, type: "REPLY", title: "New reply to your question", message: "Ananya Rao replied to your question.", time: "5 min ago", read: false, postId: 101 },
  { id: 2, type: "POLL", title: "Poll activity", message: "Your poll received new votes.", time: "1 hour ago", read: false, postId: 103 },
  { id: 3, type: "MENTION", title: "You were mentioned", message: "Vikram Patel mentioned you in a discussion.", time: "2 hours ago", read: true, postId: 102 },
  { id: 4, type: "FOLLOWED", title: "Followed discussion updated", message: "A discussion you follow received a new reply.", time: "Yesterday", read: true, postId: 104 },
];

function nowMinus(minutes: number) { return Date.now() - minutes * 60 * 1000; }
function normalizeTenant(value?: string): TenantType {
  const v = (value || "").toUpperCase();
  if (v.includes("SKILL")) return "SKILL_ACADEMY";
  if (v.includes("CORPORATE")) return "CORPORATE";
  if (v.includes("NGO")) return "NGO";
  if (v.includes("GOVERNMENT")) return "GOVERNMENT";
  return "UNIVERSITY";
}
function normalizeRole(value?: string): RoleKey {
  const v = (value || "").toUpperCase();
  if (v.includes("SUPER")) return "SUPER_ADMIN";
  if (v.includes("PLATFORM")) return "PLATFORM_ADMIN";
  if (v.includes("ADMIN")) return "TENANT_ADMIN";
  if (v.includes("COORDINATOR")) return "COORDINATOR";
  if (v.includes("MANAGER")) return "MANAGER";
  if (v.includes("FACULTY")) return "FACULTY";
  if (v.includes("TRAINER")) return "TRAINER";
  if (v.includes("STUDENT")) return "STUDENT";
  if (v.includes("EMPLOYEE")) return "EMPLOYEE";
  if (v.includes("OFFICER")) return "OFFICER";
  if (v.includes("VOLUNTEER")) return "VOLUNTEER";
  if (v.includes("MEMBER")) return "MEMBER";
  return "LEARNER";
}
function actorLabel(role: RoleKey) { return role.replaceAll("_", " "); }
function timeAgo(timestamp: number) {
  const mins = Math.max(1, Math.floor((Date.now() - timestamp) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
function scoreTrending(post: Post) {
  const reactions = Object.values(post.reactions).reduce((a, b) => a + b, 0);
  const ageHours = Math.max(1, (Date.now() - post.createdAt) / 3600000);
  return post.views * .08 + post.replies.length * 12 + reactions * 3 + (post.bookmarked ? 20 : 0) + (post.following ? 16 : 0) + 120 / ageHours;
}
function canCreateType(role: RoleKey, type: PostType) {
  if (["SUPER_ADMIN","PLATFORM_ADMIN","TENANT_ADMIN","COORDINATOR","MANAGER","FACULTY","TRAINER"].includes(role)) return true;
  if (type === "POLL" && ["STUDENT","LEARNER","VOLUNTEER","MEMBER"].includes(role)) return false;
  return true;
}
function seedPosts(tenant: TenantType, communities: Community[]): Post[] {
  const c1 = communities[0], c2 = communities[Math.min(1, communities.length - 1)], c3 = communities[Math.min(2, communities.length - 1)];
  return [
    {
      id: 101, tenant, type: "QUESTION", title: tenant === "CORPORATE" ? "How should we optimize our shared component library?" : "How does BigQuery partition pruning work?",
      body: "I understand the basic concept, but I am confused about how the system decides what data needs to be scanned. Can someone explain with a practical example?",
      author: "Rahul Sharma", authorRole: tenant === "CORPORATE" ? "Employee" : "Student", communityId: c2.id, communityName: c2.name,
      scopeId: c2.scopes[0].id, scopeLabel: c2.scopes[0].label, tags: tenant === "CORPORATE" ? ["Frontend","Architecture"] : ["BigQuery","GCP","DataEngineering"],
      createdAt: nowMinus(20), views: 130, reactions: { "👍": 24, "❤️": 7, "💡": 5 }, status: "SOLVED", following: true, bookmarked: false, attachmentName: "partition-example.png",
      replies: [
        { id: 1001, author: "Dr. Ananya Rao", role: tenant === "SKILL_ACADEMY" ? "Trainer" : tenant === "CORPORATE" ? "Manager" : "Faculty", body: "Partition pruning scans only partitions matching the filter predicate. Filter directly on the partition column so unrelated partitions can be skipped.", time: "18 min ago", likes: 23, accepted: true, comments: [{ id: 2001, author: "Rahul Sharma", body: "That makes sense. So the filter should use the partition column directly?", time: "12 min ago" }] },
        { id: 1002, author: "Vikram Patel", role: "Student", body: "You can also compare bytes processed before running the query. It makes the effect easy to see.", time: "35 min ago", likes: 5, comments: [] },
      ],
    },
    {
      id: 102, tenant, type: "DISCUSSION", title: tenant === "SKILL_ACADEMY" ? "Which project should our cohort build next?" : tenant === "CORPORATE" ? "What should we improve in our onboarding programme?" : "Best practices for BigQuery optimization",
      body: "Share your experience, examples, useful patterns and things that did not work. Keep the conversation practical and relevant to the community.",
      author: "Ananya Rao", authorRole: tenant === "CORPORATE" ? "Manager" : tenant === "SKILL_ACADEMY" ? "Trainer" : "Faculty", communityId: c2.id, communityName: c2.name,
      scopeId: c2.scopes[0].id, scopeLabel: c2.scopes[0].label, tags: ["BestPractice","Community"], createdAt: nowMinus(140), views: 245,
      reactions: { "👍": 32, "👏": 9 }, replies: [{ id: 1003, author: "Priya Mehta", role: "Learner", body: "I would include a small checklist and one practical example for each recommendation.", time: "1 hour ago", likes: 8, comments: [] }], status: "ANSWERED", following: false, bookmarked: true,
    },
    {
      id: 103, tenant, type: "POLL", title: tenant === "CORPORATE" ? "Which internal learning session should we run next?" : "Which technology should we practice next?",
      body: "Vote and share your preference. Results update immediately in this frontend demo.", author: "Priya Mehta", authorRole: tenant === "CORPORATE" ? "Employee" : "Student",
      communityId: c1.id, communityName: c1.name, scopeId: c1.scopes[0].id, scopeLabel: c1.scopes[0].label, tags: ["Poll","Practice"], createdAt: nowMinus(180), views: 520,
      reactions: { "👍": 45, "❤️": 12 }, replies: [], status: "OPEN",
      poll: { options: [{ id:1,text:"Python (Advanced)",votes:60 },{ id:2,text:"Java",votes:34 },{ id:3,text:"Go",votes:27 },{ id:4,text:"TypeScript",votes:13 }], votedOptionIds: [], multiple: false, showResultsAfterVote: true, allowComments: true },
    },
    {
      id: 104, tenant, type: "RESOURCE", title: tenant === "UNIVERSITY" ? "AWS certification preparation resources" : "Useful learning resources for this month",
      body: "A curated resource collection for anyone preparing for the next learning milestone. Save it for later and add useful context in replies.", author: "Vikram Patel", authorRole: "Learner",
      communityId: c3.id, communityName: c3.name, scopeId: c3.scopes[0].id, scopeLabel: c3.scopes[0].label, tags: ["Learning","Resource"], createdAt: nowMinus(300), views: 390,
      reactions: { "👍": 32, "💡": 10 }, replies: [], status: "OPEN", resourceUrl: "https://example.com/resource", attachmentName: "learning-resource.pdf",
    },
  ];
}

export default function DiscussionForumPage() {
  const [login, setLogin] = useState<LoginContext>({ role: "STUDENT", displayRole: "Student", tenantType: "UNIVERSITY", displayTenant: "University & College" });
  const [screen, setScreen] = useState<Screen>("HOME");
  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | PostType>("ALL");
  const [sort, setSort] = useState<SortKey>("LATEST");
  const [statusFilter, setStatusFilter] = useState<StatusKey>("ALL");
  const [communityFilter, setCommunityFilter] = useState("ALL");
  const [scopeFilter, setScopeFilter] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [openFilterDropdown, setOpenFilterDropdown] = useState<"COMMUNITY" | "AUDIENCE" | "STATUS" | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<CreateStep>(1);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [replySort, setReplySort] = useState<"TOP" | "LATEST" | "OLDEST">("TOP");
  const [replyText, setReplyText] = useState("");
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [showReplyEmojiPicker, setShowReplyEmojiPicker] = useState(false);
  const [replyAttachmentName, setReplyAttachmentName] = useState("");
  const replyTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const replyAttachmentInputRef = useRef<HTMLInputElement | null>(null);
  const [notificationFilter, setNotificationFilter] = useState<"ALL" | "UNREAD" | "MENTIONS" | "REPLIES">("ALL");
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [reportReason, setReportReason] = useState("Spam");
  const [reportDetails, setReportDetails] = useState("");
  const [toast, setToast] = useState("");
  const [draft, setDraft] = useState<CreateDraft>({ type:null,title:"",description:"",tags:"",communityId:"",scopeId:"",attachmentName:"",resourceUrl:"",pollQuestion:"",pollOptions:["",""],pollMultiple:false,pollShowResults:true,pollAllowComments:true });
  const descriptionRef = useRef<HTMLDivElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const savedEditorRangeRef = useRef<Range | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editorState, setEditorState] = useState({
    bold: false,
    italic: false,
    underline: false,
    ordered: false,
    bullet: false,
    quote: false,
    code: false,
  });

  function syncDescriptionFromEditor() {
    const editor = descriptionRef.current;
    if (!editor) return;

    setDraft((current) => ({
      ...current,
      description: editor.innerHTML,
    }));
  }

  function saveEditorSelection() {
    const editor = descriptionRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const node =
      range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? (range.commonAncestorContainer as Element)
        : range.commonAncestorContainer.parentElement;

    if (!node || !editor.contains(node)) return;

    savedEditorRangeRef.current = range.cloneRange();
  }

  function restoreEditorSelection() {
    const editor = descriptionRef.current;
    const selection = window.getSelection();

    if (!editor || !selection) return false;

    editor.focus();

    if (savedEditorRangeRef.current) {
      selection.removeAllRanges();
      selection.addRange(savedEditorRangeRef.current.cloneRange());
      return true;
    }

    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);

    selection.removeAllRanges();
    selection.addRange(range);
    savedEditorRangeRef.current = range.cloneRange();

    return true;
  }

  function selectionInsideEditor() {
    const editor = descriptionRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const node =
      range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? (range.commonAncestorContainer as Element)
        : range.commonAncestorContainer.parentElement;

    if (!node || !editor.contains(node)) return null;

    return { editor, selection, range };
  }

  function resetInlineTypingState() {
    // Ensure future typing is not accidentally kept bold/italic/underlined.
    try {
      if (document.queryCommandState("bold")) {
        document.execCommand("bold", false);
      }
      if (document.queryCommandState("italic")) {
        document.execCommand("italic", false);
      }
      if (document.queryCommandState("underline")) {
        document.execCommand("underline", false);
      }
    } catch {
      // Browser may not expose command state consistently; normal editor CSS
      // still keeps root typing normal.
    }
  }

  function applySelectedInline(
    command: "bold" | "italic" | "underline",
    label: string
  ) {
    restoreEditorSelection();

    const data = selectionInsideEditor();
    if (!data) {
      showToast("Place the cursor inside the description first.");
      return;
    }

    const { selection, range } = data;

    if (range.collapsed) {
      showToast(`Select text first, then click ${label}.`);
      return;
    }

    document.execCommand(command, false);

    // Move to the end of the selected range.
    selection.collapseToEnd();

    // Turn the inline mode off for whatever the user types next.
    resetInlineTypingState();

    saveEditorSelection();
    syncDescriptionFromEditor();
  }

  function applyListCommand(command: "insertOrderedList" | "insertUnorderedList") {
    restoreEditorSelection();

    const data = selectionInsideEditor();
    if (!data) {
      showToast("Place the cursor inside the description first.");
      return;
    }

    document.execCommand(command, false);
    saveEditorSelection();
    syncDescriptionFromEditor();
  }

  function applyBlockCommand(tag: "blockquote" | "pre") {
    restoreEditorSelection();

    const data = selectionInsideEditor();
    if (!data) {
      showToast("Place the cursor inside the description first.");
      return;
    }

    document.execCommand("formatBlock", false, tag);
    saveEditorSelection();
    syncDescriptionFromEditor();
  }

  function insertEditorLink() {
    restoreEditorSelection();

    const data = selectionInsideEditor();
    if (!data) {
      showToast("Place the cursor inside the description first.");
      return;
    }

    const selectedText = data.range.toString().trim();
    const url = window.prompt("Enter the web link", "https://");

    if (!url) return;

    restoreEditorSelection();

    if (selectedText) {
      document.execCommand("createLink", false, url);

      const selection = window.getSelection();
      if (selection && selection.anchorNode) {
        const parent =
          selection.anchorNode.nodeType === Node.ELEMENT_NODE
            ? (selection.anchorNode as Element)
            : selection.anchorNode.parentElement;

        const anchor = parent?.closest("a");
        if (anchor) {
          anchor.setAttribute("target", "_blank");
          anchor.setAttribute("rel", "noopener noreferrer");
        }
      }
    } else {
      document.execCommand(
        "insertHTML",
        false,
        `<a href="${url.replace(/"/g, "&quot;")}" target="_blank" rel="noopener noreferrer">${url}</a>&nbsp;`
      );
    }

    saveEditorSelection();
    syncDescriptionFromEditor();
  }

  function insertMention() {
    const name = window.prompt("Enter the name to mention");
    if (name === null) return;

    const clean = name.trim().replace(/^@+/, "");

    restoreEditorSelection();

    document.execCommand(
      "insertText",
      false,
      clean ? `@${clean} ` : "@"
    );

    saveEditorSelection();
    syncDescriptionFromEditor();
  }

  function insertEmoji(emoji: string) {
    restoreEditorSelection();
    document.execCommand("insertText", false, emoji);

    saveEditorSelection();
    syncDescriptionFromEditor();
    setShowEmojiPicker(false);
  }

  function runEditorAction(action: string) {
    switch (action) {
      case "bold":
        applySelectedInline("bold", "Bold");
        break;

      case "italic":
        applySelectedInline("italic", "Italic");
        break;

      case "underline":
        applySelectedInline("underline", "Underline");
        break;

      case "numbered":
        applyListCommand("insertOrderedList");
        break;

      case "bullet":
        applyListCommand("insertUnorderedList");
        break;

      case "quote":
        applyBlockCommand("blockquote");
        break;

      case "attachment":
        attachmentInputRef.current?.click();
        break;

      case "link":
        insertEditorLink();
        break;

      case "code":
        applyBlockCommand("pre");
        break;

      case "mention":
        insertMention();
        break;

      case "emoji":
        setShowEmojiPicker((open) => !open);
        break;
    }
  }

  function editorButtonMouseDown(
    event: React.MouseEvent<HTMLButtonElement>,
    action: string
  ) {
    // Keep the current editor selection when clicking the toolbar.
    event.preventDefault();
    saveEditorSelection();
    runEditorAction(action);
  }

  function handleEditorKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    // Enter after quote/code/list should behave naturally.
    // Escape returns to a normal paragraph.
    if (event.key === "Escape") {
      event.preventDefault();
      document.execCommand("formatBlock", false, "div");
      resetInlineTypingState();
      saveEditorSelection();
      syncDescriptionFromEditor();
    }
  }

  function plainTextFromHtml(html: string) {
    return html
      .replace(/<br\s*\/?>(?=.)/gi, " ")
      .replace(/<\/p>|<\/div>|<\/li>|<\/blockquote>|<\/pre>/gi, " ")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
  }

  useEffect(() => { try { const raw = localStorage.getItem("calendar_dummy_login"); if (raw) setLogin(JSON.parse(raw)); } catch {} }, []);
  useEffect(() => {
    if (createOpen && createStep === 2 && descriptionRef.current) {
      if (descriptionRef.current.innerHTML !== draft.description) {
        descriptionRef.current.innerHTML = draft.description;
      }

      setEditorState({
        bold: false,
        italic: false,
        underline: false,
        ordered: false,
        bullet: false,
        quote: false,
        code: false,
      });
      // Put the caret at the end of the editor root, outside any formatting tag.
      requestAnimationFrame(() => {
        const editor = descriptionRef.current;
        const selection = window.getSelection();

        if (!editor || !selection) return;

        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);

        selection.removeAllRanges();
        selection.addRange(range);
      });
    }
  }, [createOpen, createStep, draft.type]);

  const tenant = useMemo(() => normalizeTenant(login.tenantType || login.displayTenant), [login.tenantType, login.displayTenant]);
  const role = useMemo(() => normalizeRole(login.role || login.displayRole), [login.role, login.displayRole]);
  const communities = TENANT_COMMUNITIES[tenant];

  useEffect(() => {
    try {
      const key = `discussion_demo_posts_${tenant}`;
      const stored = localStorage.getItem(key);
      setPosts(stored ? JSON.parse(stored) : seedPosts(tenant, communities));
    } catch { setPosts(seedPosts(tenant, communities)); }
  }, [tenant, communities]);
  useEffect(() => { if (posts.length) try { localStorage.setItem(`discussion_demo_posts_${tenant}`, JSON.stringify(posts)); } catch {} }, [posts, tenant]);

  const selectedPost = posts.find(p => p.id === selectedPostId) || null;
  const draftCommunity = communities.find(c => c.id === draft.communityId) || null;
  const availableScopes = draftCommunity?.scopes || [];
  const recentPosts = useMemo(() => [...posts].sort((a,b)=>b.createdAt-a.createdAt).slice(0,3), [posts]);
  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredPosts = useMemo(() => {
    let result = posts.filter(post => {
      if (typeFilter !== "ALL" && post.type !== typeFilter) return false;
      if (communityFilter !== "ALL" && post.communityId !== communityFilter) return false;
      if (scopeFilter !== "ALL" && post.scopeId !== scopeFilter) return false;
      if (statusFilter === "OPEN" && post.status !== "OPEN") return false;
      if (statusFilter === "ANSWERED" && post.status !== "ANSWERED") return false;
      if (statusFilter === "SOLVED" && post.status !== "SOLVED") return false;
      if (statusFilter === "UNANSWERED" && !(post.type === "QUESTION" && post.replies.length === 0)) return false;
      const q = search.trim().toLowerCase();
      if (q) {
        const text = [post.title,plainTextFromHtml(post.body),post.author,post.communityName,post.scopeLabel,...post.tags,...post.replies.map(r=>r.body)].join(" ").toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
    if (sort === "LATEST") result = [...result].sort((a,b)=>b.createdAt-a.createdAt);
    if (sort === "TRENDING") result = [...result].sort((a,b)=>scoreTrending(b)-scoreTrending(a));
    if (sort === "UNANSWERED") result = result.filter(p=>p.type === "QUESTION" && p.replies.length === 0);
    if (sort === "MOST_DISCUSSSED") result = [...result].sort((a,b)=>b.replies.length-a.replies.length);
    return result;
  }, [posts,typeFilter,communityFilter,scopeFilter,statusFilter,search,sort]);

  const visibleNotifications = notifications.filter(n => notificationFilter === "ALL" || (notificationFilter === "UNREAD" && !n.read) || (notificationFilter === "MENTIONS" && n.type === "MENTION") || (notificationFilter === "REPLIES" && ["REPLY","ACCEPTED"].includes(n.type)));
  const allScopes = communities.flatMap(c => c.scopes.map(s => ({...s, communityId:c.id})));

  function showToast(message: string) { setToast(message); window.setTimeout(()=>setToast(""), 2200); }
  function openDetail(id: number) { setSelectedPostId(id); setScreen("DETAIL"); setPosts(items=>items.map(p=>p.id===id?{...p,views:p.views+1}:p)); }
  function resetDraft() { setDraft({ type:null,title:"",description:"",tags:"",communityId:"",scopeId:"",attachmentName:"",resourceUrl:"",pollQuestion:"",pollOptions:["",""],pollMultiple:false,pollShowResults:true,pollAllowComments:true }); setCreateStep(1); }
  function closeCreate() { setCreateOpen(false); resetDraft(); }
  function chooseType(type: PostType) { setDraft(d=>({...d,type})); setCreateStep(2); }
  function nextCreate() {
    if (createStep === 2) {
      if (draft.type === "POLL") {
        if (!draft.pollQuestion.trim()) return showToast("Enter the poll question.");
        if (draft.pollOptions.filter(Boolean).length < 2) return showToast("Add at least two poll options.");
      } else if (!draft.title.trim() || !plainTextFromHtml(draft.description)) return showToast("Enter title and description.");
    }
    if (createStep === 3 && (!draft.communityId || !draft.scopeId)) return showToast("Select community and target audience.");
    setCreateStep(Math.min(4, createStep + 1) as CreateStep);
  }
  function publishPost() {
    if (!draft.type || !draftCommunity) return;
    const scope = draftCommunity.scopes.find(s=>s.id===draft.scopeId); if (!scope) return;
    const post: Post = {
      id: Date.now(), tenant, type: draft.type, title: draft.type === "POLL" ? draft.pollQuestion : draft.title,
      body: draft.description || (draft.type === "POLL" ? "Vote below and share your opinion." : ""), author: "Current User", authorRole: login.displayRole || actorLabel(role),
      communityId:draftCommunity.id,communityName:draftCommunity.name,scopeId:scope.id,scopeLabel:scope.label,tags:draft.tags.split(",").map(x=>x.trim()).filter(Boolean),createdAt:Date.now(),views:0,reactions:{},replies:[],status:"OPEN",
      attachmentName:draft.attachmentName||undefined,resourceUrl:draft.type==="RESOURCE"?(draft.resourceUrl||undefined):undefined,
      poll:draft.type==="POLL"?{options:draft.pollOptions.filter(Boolean).map((text,i)=>({id:i+1,text,votes:0})),votedOptionIds:[],multiple:draft.pollMultiple,showResultsAfterVote:draft.pollShowResults,allowComments:draft.pollAllowComments}:undefined,
    };
    setPosts(items=>[post,...items]); setCreateOpen(false); resetDraft(); setSelectedPostId(post.id); setScreen("DETAIL"); showToast("Post submitted successfully.");
  }
  function handleFile(e: ChangeEvent<HTMLInputElement>) { const file=e.target.files?.[0]; if(file) setDraft(d=>({...d,attachmentName:file.name})); }
  function reactToPost(id:number,reaction:string){
    setPosts(items=>items.map(p=>p.id===id?{...p,reactions:{...p.reactions,[reaction]:(p.reactions[reaction]||0)+1}}:p));
    showToast(`${reaction} reaction added.`);
  }
  function toggleFollow(id:number){
    setPosts(items=>items.map(p=>p.id===id?{...p,following:!p.following}:p));
  }
  function toggleBookmark(id:number){
    setPosts(items=>items.map(p=>p.id===id?{...p,bookmarked:!p.bookmarked}:p));
  }
  function focusReply(replyId?:number){
    setReplyingToId(replyId ?? null);
    window.setTimeout(()=>replyTextareaRef.current?.focus(),0);
  }
  function likeReply(replyId:number){
    if(!selectedPost)return;
    setPosts(items=>items.map(p=>p.id===selectedPost.id?{
      ...p,
      replies:p.replies.map(r=>r.id===replyId?{...r,likes:r.likes+1}:r)
    }:p));
  }
  function addReply(){
    if(!selectedPost)return;
    const body = replyText.trim();
    if(!body && !replyAttachmentName)return;

    const finalBody = `${body}${body&&replyAttachmentName?"\n":""}${replyAttachmentName?`📎 ${replyAttachmentName}`:""}`;

    if(replyingToId){
      const comment: ReplyComment = {
        id:Date.now(),
        author:"Current User",
        body:finalBody,
        time:"Just now"
      };
      setPosts(items=>items.map(p=>p.id===selectedPost.id?{
        ...p,
        replies:p.replies.map(r=>r.id===replyingToId?{...r,comments:[...r.comments,comment]}:r)
      }:p));
      showToast("Reply added to conversation.");
    } else {
      const r:Reply={
        id:Date.now(),
        author:"Current User",
        role:login.displayRole||actorLabel(role),
        body:finalBody,
        time:"Just now",
        likes:0,
        comments:[]
      };
      setPosts(items=>items.map(p=>p.id===selectedPost.id?{
        ...p,
        replies:[...p.replies,r],
        status:p.type==="QUESTION"&&p.status==="OPEN"?"ANSWERED":p.status
      }:p));
      showToast("Reply posted.");
    }

    setReplyText("");
    setReplyAttachmentName("");
    setReplyingToId(null);
    setShowReplyEmojiPicker(false);
    if(replyAttachmentInputRef.current) replyAttachmentInputRef.current.value="";
  }
  function insertReplyText(value:string){
    const el=replyTextareaRef.current;
    if(!el){setReplyText(current=>current+value);return;}
    const start=el.selectionStart??replyText.length;
    const end=el.selectionEnd??replyText.length;
    setReplyText(replyText.slice(0,start)+value+replyText.slice(end));
    window.setTimeout(()=>{
      el.focus();
      const caret=start+value.length;
      el.setSelectionRange(caret,caret);
    },0);
  }
  function insertReplyCode(){
    const el=replyTextareaRef.current;
    if(!el){insertReplyText("```\n\n```");return;}
    const start=el.selectionStart??0;
    const end=el.selectionEnd??0;
    const selected=replyText.slice(start,end);
    const value=selected?`\`${selected}\``:"```\ncode\n```";
    setReplyText(replyText.slice(0,start)+value+replyText.slice(end));
    window.setTimeout(()=>el.focus(),0);
  }
  function handleReplyAttachment(e:ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];
    if(file)setReplyAttachmentName(file.name);
  }
  async function shareSelectedPost(){
    if(!selectedPost)return;
    const title=selectedPost.title;
    const url=window.location.href;
    try{
      if(navigator.share){
        await navigator.share({title,text:title,url});
        showToast("Post shared.");
      }else if(navigator.clipboard){
        await navigator.clipboard.writeText(url);
        showToast("Post link copied.");
      }else{
        showToast("Sharing is not supported in this browser.");
      }
    }catch{
      // User cancelling the native share sheet is not an error for the UI.
    }
  }
  function markAccepted(replyId:number){if(!selectedPost)return;setPosts(items=>items.map(p=>p.id===selectedPost.id?{...p,status:"SOLVED",replies:p.replies.map(r=>({...r,accepted:r.id===replyId}))}:p));showToast("Answer marked as accepted.");}
  function vote(postId:number,optionId:number){setPosts(items=>items.map(post=>{if(post.id!==postId||!post.poll)return post;const old=post.poll.votedOptionIds;let voted=post.poll.multiple?(old.includes(optionId)?old.filter(x=>x!==optionId):[...old,optionId]):[optionId];const options=post.poll.options.map(o=>({...o,votes:Math.max(0,o.votes+(old.includes(o.id)&&!voted.includes(o.id)?-1:0)+(!old.includes(o.id)&&voted.includes(o.id)?1:0))}));return{...post,poll:{...post.poll,votedOptionIds:voted,options}};}));}
  function submitReport(){setReportTarget(null);setReportDetails("");setReportReason("Spam");showToast("Report submitted for review.");}
  function clearFilters(){setSearch("");setTypeFilter("ALL");setSort("LATEST");setStatusFilter("ALL");setCommunityFilter("ALL");setScopeFilter("ALL");}

  return <main className="discussionPage">
    <header className="discussionTopbar">
      <button className="brandButton" onClick={()=>setScreen("HOME")}><span className="brandIcon">D</span><span><b>Discussions</b><small>{login.displayTenant||tenant.replaceAll("_"," ")}</small></span></button>
      <div className="topbarActions"><button className="notificationButton" onClick={()=>setScreen("NOTIFICATIONS")}>🔔{unreadCount>0&&<span>{unreadCount}</span>}</button><div className="roleChip"><span>{(login.displayRole||actorLabel(role)).slice(0,1)}</span><div><b>{login.displayRole||actorLabel(role)}</b><small>{tenant.replaceAll("_"," ")}</small></div></div></div>
    </header>

    {screen === "HOME" && <>
      <section className="heroSection"><div><p className="eyebrow">Community learning</p><h1>Discussions</h1><p>Ask questions, share knowledge, exchange ideas and learn together.</p></div><button className="primaryButton createButton" onClick={()=>setCreateOpen(true)}>＋ Create Post</button></section>

      <section className="overviewGrid">
        <article className="overviewCard"><small>My Communities</small><strong>{communities.length}</strong><span>Available for your tenant and role</span></article>
        <article className="overviewCard"><small>Recent Posts</small><strong>{posts.length}</strong><span>Visible within your current scope</span></article>
        <article className="overviewCard wide"><small>Recently active</small><div className="recentMiniList">{recentPosts.map(p=><button key={p.id} onClick={()=>openDetail(p.id)}><span>{POST_LABELS[p.type].icon}</span><div><b>{p.title}</b><small>{p.communityName} · {timeAgo(p.createdAt)}</small></div></button>)}</div></article>
      </section>

      <section className="discoverPanel">
        <div className="searchRow"><label className="searchBox"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search posts, replies, tags, people or communities..."/></label><button className={`softButton ${showFilters?"active":""}`} onClick={()=>setShowFilters(v=>!v)}>⚙ Filters</button></div>
        <div className="typeTabs"><button className={typeFilter==="ALL"?"active":""} onClick={()=>setTypeFilter("ALL")}>All</button>{(Object.keys(POST_LABELS) as PostType[]).map(t=><button key={t} className={typeFilter===t?"active":""} onClick={()=>setTypeFilter(t)}>{POST_LABELS[t].label}s</button>)}</div>
        <div className="sortTabs sortLine"><button className={sort==="LATEST"?"active":""} onClick={()=>setSort("LATEST")}>Latest</button><button className={sort==="TRENDING"?"active":""} onClick={()=>setSort("TRENDING")}>Trending</button><button className={sort==="UNANSWERED"?"active":""} onClick={()=>setSort("UNANSWERED")}>Unanswered</button><button className={sort==="MOST_DISCUSSSED"?"active":""} onClick={()=>setSort("MOST_DISCUSSSED")}>Most Discussed</button></div>
        {showFilters&&<div className="filterPanel">
          <label>Community
            <div className={`filterDropdown ${openFilterDropdown === "COMMUNITY" ? "open" : ""}`}>
              <button type="button" className="filterDropdownTrigger" onClick={()=>setOpenFilterDropdown(openFilterDropdown === "COMMUNITY" ? null : "COMMUNITY")}>
                <span>{communityFilter === "ALL" ? "All Communities" : communities.find(c=>c.id===communityFilter)?.name || "All Communities"}</span><span className="filterDropdownArrow">⌄</span>
              </button>
              {openFilterDropdown === "COMMUNITY"&&<div className="filterDropdownMenu">
                <button type="button" className={communityFilter === "ALL" ? "selected" : ""} onClick={()=>{setCommunityFilter("ALL");setScopeFilter("ALL");setOpenFilterDropdown(null);}}><span className="filterOptionCheck">{communityFilter === "ALL" ? "✓" : ""}</span><span>All Communities</span></button>
                {communities.map(c=><button type="button" key={c.id} className={communityFilter === c.id ? "selected" : ""} onClick={()=>{setCommunityFilter(c.id);setScopeFilter("ALL");setOpenFilterDropdown(null);}}><span className="filterOptionCheck">{communityFilter === c.id ? "✓" : ""}</span><span>{c.name}</span></button>)}
              </div>}
            </div>
          </label>
          <label>Target Audience
            <div className={`filterDropdown ${openFilterDropdown === "AUDIENCE" ? "open" : ""}`}>
              <button type="button" className="filterDropdownTrigger" onClick={()=>setOpenFilterDropdown(openFilterDropdown === "AUDIENCE" ? null : "AUDIENCE")}>
                <span>{scopeFilter === "ALL" ? "All Audiences" : allScopes.find(s=>s.id===scopeFilter)?.label || "All Audiences"}</span><span className="filterDropdownArrow">⌄</span>
              </button>
              {openFilterDropdown === "AUDIENCE"&&<div className="filterDropdownMenu">
                <button type="button" className={scopeFilter === "ALL" ? "selected" : ""} onClick={()=>{setScopeFilter("ALL");setOpenFilterDropdown(null);}}><span className="filterOptionCheck">{scopeFilter === "ALL" ? "✓" : ""}</span><span>All Audiences</span></button>
                {allScopes.filter(s=>communityFilter==="ALL"||s.communityId===communityFilter).map(s=><button type="button" key={`${s.communityId}-${s.id}`} className={scopeFilter === s.id ? "selected" : ""} onClick={()=>{setScopeFilter(s.id);setOpenFilterDropdown(null);}}><span className="filterOptionCheck">{scopeFilter === s.id ? "✓" : ""}</span><span>{s.label}</span></button>)}
              </div>}
            </div>
          </label>
          <label>Status
            <div className={`filterDropdown ${openFilterDropdown === "STATUS" ? "open" : ""}`}>
              <button type="button" className="filterDropdownTrigger" onClick={()=>setOpenFilterDropdown(openFilterDropdown === "STATUS" ? null : "STATUS")}>
                <span>{statusFilter === "ALL" ? "All Status" : statusFilter === "OPEN" ? "Open" : statusFilter === "ANSWERED" ? "Answered" : statusFilter === "SOLVED" ? "Solved" : "Unanswered"}</span><span className="filterDropdownArrow">⌄</span>
              </button>
              {openFilterDropdown === "STATUS"&&<div className="filterDropdownMenu">
                {[
                  ["ALL","All Status"],
                  ["OPEN","Open"],
                  ["ANSWERED","Answered"],
                  ["SOLVED","Solved"],
                  ["UNANSWERED","Unanswered"],
                ].map(([value,label])=><button type="button" key={value} className={statusFilter === value ? "selected" : ""} onClick={()=>{setStatusFilter(value as StatusKey);setOpenFilterDropdown(null);}}><span className="filterOptionCheck">{statusFilter === value ? "✓" : ""}</span><span>{label}</span></button>)}
              </div>}
            </div>
          </label>
          <button className="softButton" onClick={()=>{clearFilters();setOpenFilterDropdown(null);}}>Clear</button>
        </div>}
      </section>

      <div className="homeLayout"><aside className="communityRail"><div className="railHeading"><div><small>Accessible</small><h3>My Communities</h3></div><span>{communities.length}</span></div><button className={communityFilter==="ALL"?"active":""} onClick={()=>{setCommunityFilter("ALL");setScopeFilter("ALL");}}><span className="communityIcon">✨</span><div><b>All Communities</b><small>Everything available to you</small></div></button>{communities.map(c=><button key={c.id} className={communityFilter===c.id?"active":""} onClick={()=>{setCommunityFilter(c.id);setScopeFilter("ALL");}}><span className="communityIcon">{c.icon}</span><div><b>{c.name}</b><small>{c.scopes.length} audience scopes</small></div></button>)}</aside>
      <section className="feed"><div className="feedHeader"><div><small>{sort==="TRENDING"?"Popular now":"Community feed"}</small><h2>{sort==="TRENDING"?"Trending Discussions":"Latest Discussions"}</h2></div><span>{filteredPosts.length} results</span></div>
      {filteredPosts.length===0?<div className="emptyState"><span>⌕</span><h3>No discussions found</h3><p>Try another filter or create a new post.</p></div>:<div className="feedList">{filteredPosts.map(post=>{const rc=Object.values(post.reactions).reduce((a,b)=>a+b,0);return <article className="postCard" key={post.id}><button className="postMain" onClick={()=>openDetail(post.id)}><div className="postTop"><span className={`postType ${POST_LABELS[post.type].color}`}>{POST_LABELS[post.type].icon} {POST_LABELS[post.type].label}</span><span className="postTime">{timeAgo(post.createdAt)}</span></div><h3>{post.title}</h3><div className="postExcerpt richTextOutput" dangerouslySetInnerHTML={{ __html: post.body }} /><div className="tagRow">{post.tags.map(t=><span key={t}>#{t}</span>)}</div></button>
      {post.poll&&<div className="miniPoll">{post.poll.options.slice(0,3).map(o=>{const total=post.poll!.options.reduce((s,x)=>s+x.votes,0)||1;const pct=Math.round(o.votes/total*100);return <div key={o.id}><span>{o.text}</span><i><em style={{width:`${pct}%`}}/></i><b>{pct}%</b></div>})}</div>}
      <footer className="postFooter"><div className="authorMini"><span className="avatar">{post.author.split(" ").map(x=>x[0]).join("").slice(0,2)}</span><div><b>{post.author}</b><small>{post.authorRole} · {post.communityName} · {post.scopeLabel}</small></div></div><div className="postStats"><span>👍 {rc}</span><span>💬 {post.replies.length}</span><span>◉ {post.views}</span>{post.status==="SOLVED"&&<span className="solvedChip">✓ Solved</span>}</div></footer></article>})}</div>}</section></div>
    </>}

    {screen==="DETAIL"&&selectedPost&&<section className="detailPage"><button className="backButton" onClick={()=>setScreen("HOME")}>← Back to Discussions</button><div className="breadcrumb">Discussion <span>›</span> {selectedPost.communityName} <span>›</span> {selectedPost.title}</div>
      <article className="detailCard"><div className="detailHeader"><div><span className={`postType ${POST_LABELS[selectedPost.type].color}`}>{POST_LABELS[selectedPost.type].icon} {POST_LABELS[selectedPost.type].label}</span>{selectedPost.status==="SOLVED"&&<span className="solvedChip">✓ Solved</span>}</div></div><h1>{selectedPost.title}</h1><div className="authorLine"><span className="avatar large">{selectedPost.author.split(" ").map(x=>x[0]).join("").slice(0,2)}</span><div><b>{selectedPost.author}</b><small>{selectedPost.authorRole} · {selectedPost.communityName} · {timeAgo(selectedPost.createdAt)}</small></div></div><div className="detailBodyText richTextOutput" dangerouslySetInnerHTML={{ __html: selectedPost.body }} /><div className="tagRow">{selectedPost.tags.map(t=><span key={t}>#{t}</span>)}</div>{selectedPost.attachmentName&&<button type="button" className="attachmentChip" onClick={()=>showToast(`Demo attachment: ${selectedPost.attachmentName}`)}>📎 {selectedPost.attachmentName}</button>}{selectedPost.resourceUrl&&<a className="resourceBox resourceLink" href={selectedPost.resourceUrl} target="_blank" rel="noopener noreferrer"><span>🔗</span><div><b>Shared Resource</b><small>{selectedPost.resourceUrl}</small></div></a>}
      {selectedPost.poll&&<div className="pollCard">{selectedPost.poll.options.map(o=>{const total=selectedPost.poll!.options.reduce((s,x)=>s+x.votes,0)||1;const pct=Math.round(o.votes/total*100);const selected=selectedPost.poll!.votedOptionIds.includes(o.id);const show=!selectedPost.poll!.showResultsAfterVote||selectedPost.poll!.votedOptionIds.length>0;return <button key={o.id} className={selected?"selected":""} onClick={()=>vote(selectedPost.id,o.id)}><span className="pollRadio">{selected?"✓":""}</span><span className="pollLabel">{o.text}</span>{show&&<><span className="pollTrack"><i style={{width:`${pct}%`}}/></span><b>{pct}%</b></>}</button>})}<small>Total Votes: {selectedPost.poll.options.reduce((s,x)=>s+x.votes,0)}</small></div>}
      <div className="detailActions"><div className="reactionBar">{REACTIONS.map(r=><button key={r} onClick={()=>reactToPost(selectedPost.id,r)}>{r} {selectedPost.reactions[r]||0}</button>)}</div><div className="utilityActions"><button className={selectedPost.following?"active":""} onClick={()=>toggleFollow(selectedPost.id)}>☆ {selectedPost.following?"Following":"Follow"}</button><button className={selectedPost.bookmarked?"active":""} onClick={()=>toggleBookmark(selectedPost.id)}>🔖 {selectedPost.bookmarked?"Saved":"Save"}</button><button onClick={shareSelectedPost}>↗ Share</button><button onClick={()=>setReportTarget({kind:"POST",id:selectedPost.id,title:selectedPost.title})}>⚑ Report</button></div></div></article>
      {(selectedPost.type!=="POLL"||selectedPost.poll?.allowComments)&&<section className="replySection"><div className="replySectionHeader"><h2>{selectedPost.replies.length} Replies</h2><div className="replySort"><button className={replySort==="TOP"?"active":""} onClick={()=>setReplySort("TOP")}>Top</button><button className={replySort==="LATEST"?"active":""} onClick={()=>setReplySort("LATEST")}>Latest</button><button className={replySort==="OLDEST"?"active":""} onClick={()=>setReplySort("OLDEST")}>Oldest</button></div></div><div className="replyList">{[...selectedPost.replies].sort((a,b)=>replySort==="TOP"?b.likes-a.likes:replySort==="LATEST"?b.id-a.id:a.id-b.id).map(r=><article className={`replyCard ${r.accepted?"accepted":""}`} key={r.id}><div className="authorLine"><span className="avatar">{r.author.split(" ").map(x=>x[0]).join("").slice(0,2)}</span><div><b>{r.author}</b><small>{r.role} · {r.time}</small></div>{r.accepted&&<span className="acceptedChip">✓ Accepted Answer</span>}</div><p>{r.body}</p><div className="replyActions"><button onClick={()=>likeReply(r.id)}>👍 {r.likes}</button><button onClick={()=>focusReply(r.id)}>💬 {r.comments.length}</button><button onClick={()=>focusReply(r.id)}>↩ Reply</button>{selectedPost.type==="QUESTION"&&!r.accepted&&["TENANT_ADMIN","FACULTY","TRAINER","COORDINATOR"].includes(role)&&<button onClick={()=>markAccepted(r.id)}>✓ Accept Answer</button>}<button onClick={()=>setReportTarget({kind:"REPLY",id:r.id,title:`Reply by ${r.author}`})}>⚑ Report</button></div>{r.comments.map(c=><div className="nestedComment" key={c.id}><span className="avatar tiny">{c.author.split(" ").map(x=>x[0]).join("").slice(0,2)}</span><div><b>{c.author}</b><p>{c.body}</p><small>{c.time}</small></div></div>)}</article>)}</div><div className="replyComposer"><span className="avatar">CU</span><div>{replyingToId&&<div className="replyingToBanner"><span>Replying to this conversation</span><button type="button" onClick={()=>setReplyingToId(null)}>×</button></div>}<textarea ref={replyTextareaRef} value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder={replyingToId?"Write your reply to this conversation...":"Write your reply..."}/>{replyAttachmentName&&<div className="replyAttachmentChip"><span>📎 {replyAttachmentName}</span><button type="button" onClick={()=>{setReplyAttachmentName("");if(replyAttachmentInputRef.current)replyAttachmentInputRef.current.value="";}}>×</button></div>}{showReplyEmojiPicker&&<div className="replyEmojiPicker">{["😀","🙂","😊","😂","😍","👍","👏","🎉","💡","✅"].map(emoji=><button type="button" key={emoji} onClick={()=>{insertReplyText(emoji);setShowReplyEmojiPicker(false);}}>{emoji}</button>)}</div>}<div className="composerBottom"><div><button type="button" title="Emoji" onClick={()=>setShowReplyEmojiPicker(v=>!v)}>☺</button><button type="button" title="Attach file" onClick={()=>replyAttachmentInputRef.current?.click()}>📎</button><button type="button" title="Code" onClick={insertReplyCode}>&lt;/&gt;</button><button type="button" title="Mention" onClick={()=>insertReplyText("@")}>@</button><input ref={replyAttachmentInputRef} className="replyAttachmentInput" type="file" onChange={handleReplyAttachment}/></div><button className="primaryButton" onClick={addReply}>{replyingToId?"Post Reply":"Post Reply"}</button></div></div></div></section>}
    </section>}

    {screen==="NOTIFICATIONS"&&<section className="notificationsPage"><button className="backButton" onClick={()=>setScreen("HOME")}>← Back to Discussions</button><div className="notificationHeader"><div><p className="eyebrow">Activity</p><h1>Notifications</h1></div><button className="softButton" onClick={()=>setNotifications(items=>items.map(n=>({...n,read:true})))}>Mark all as read</button></div><div className="notificationTabs"><button className={notificationFilter==="ALL"?"active":""} onClick={()=>setNotificationFilter("ALL")}>All</button><button className={notificationFilter==="UNREAD"?"active":""} onClick={()=>setNotificationFilter("UNREAD")}>Unread ({unreadCount})</button><button className={notificationFilter==="MENTIONS"?"active":""} onClick={()=>setNotificationFilter("MENTIONS")}>Mentions</button><button className={notificationFilter==="REPLIES"?"active":""} onClick={()=>setNotificationFilter("REPLIES")}>Replies</button></div><div className="notificationList">{visibleNotifications.map(n=><button key={n.id} className={`notificationItem ${!n.read?"unread":""}`} onClick={()=>{setNotifications(items=>items.map(x=>x.id===n.id?{...x,read:true}:x));if(n.postId)openDetail(n.postId);}}><span className={`notificationDot ${n.type.toLowerCase()}`}/><div><b>{n.title}</b><p>{n.message}</p><small>{n.time}</small></div>{!n.read&&<i/>}</button>)}</div></section>}

    {createOpen&&<div className="modalBackdrop"><section className="createModal"><header className="modalHeader"><div><p className="eyebrow">Create post</p><h2>{createStep===1?"What would you like to share?":createStep===2?(draft.type==="QUESTION"?"Ask your question":draft.type==="DISCUSSION"?"Start your discussion":draft.type==="POLL"?"Create your poll":"Share your resource"):createStep===3?"Choose community & target audience":"Preview & publish"}</h2></div><button onClick={closeCreate}>×</button></header><div className="createStepper">{[1,2,3,4].map(n=><span key={n} className={createStep>=n?"active":""}>{createStep>n?"✓":n}</span>)}</div><div className="modalBody">
      {createStep===1&&<div className="createTypeGrid">{TYPE_OPTIONS.filter(x=>canCreateType(role,x.type)).map(x=><button key={x.type} onClick={()=>chooseType(x.type)}><span>{x.icon}</span><b>{x.title}</b><small>{x.text}</small></button>)}</div>}
      {createStep===2&&draft.type&&<div className="formStack">{draft.type==="POLL"?<><label>Poll question *<input value={draft.pollQuestion} onChange={e=>setDraft(d=>({...d,pollQuestion:e.target.value}))} placeholder="Which technology should we practice next?"/></label><div className="pollOptionsEditor"><span className="fieldLabel">Options *</span>{draft.pollOptions.map((o,i)=><div key={i}><input value={o} onChange={e=>{const next=[...draft.pollOptions];next[i]=e.target.value;setDraft(d=>({...d,pollOptions:next}));}} placeholder={`Option ${i+1}`}/><button disabled={draft.pollOptions.length<=2} onClick={()=>setDraft(d=>({...d,pollOptions:d.pollOptions.filter((_,idx)=>idx!==i)}))}>×</button></div>)}<button className="softButton fit" onClick={()=>setDraft(d=>({...d,pollOptions:[...d.pollOptions,""]}))}>＋ Add Option</button></div><div className="toggleStack"><label className="toggleRow"><span><b>Multiple choice</b><small>Allow more than one option</small></span><input type="checkbox" checked={draft.pollMultiple} onChange={e=>setDraft(d=>({...d,pollMultiple:e.target.checked}))}/></label><label className="toggleRow"><span><b>Show results after vote</b><small>Hide results until user votes</small></span><input type="checkbox" checked={draft.pollShowResults} onChange={e=>setDraft(d=>({...d,pollShowResults:e.target.checked}))}/></label><label className="toggleRow"><span><b>Allow comments</b><small>Allow discussion below poll</small></span><input type="checkbox" checked={draft.pollAllowComments} onChange={e=>setDraft(d=>({...d,pollAllowComments:e.target.checked}))}/></label></div></>:<><label>Title *<input value={draft.title} onChange={e=>setDraft(d=>({...d,title:e.target.value}))} placeholder={draft.type==="QUESTION"?"What would you like help with?":draft.type==="RESOURCE"?"Resource title":"Discussion title"}/></label><label>Description *<div className="editorBox">
                          <div className="editorToolbar">
                            <button type="button" title="Bold" aria-label="Bold" onMouseDown={(e) => editorButtonMouseDown(e, "bold")}><b>B</b></button>
                            <button type="button" title="Italic" aria-label="Italic" onMouseDown={(e) => editorButtonMouseDown(e, "italic")}><i>I</i></button>
                            <button type="button" title="Underline" aria-label="Underline" onMouseDown={(e) => editorButtonMouseDown(e, "underline")}><u>U</u></button>
                            <button type="button" title="Numbered list" aria-label="Numbered list" onMouseDown={(e) => editorButtonMouseDown(e, "numbered")}>≡</button>
                            <button type="button" title="Bullet list" aria-label="Bullet list" onMouseDown={(e) => editorButtonMouseDown(e, "bullet")}>•</button>
                            <button type="button" title="Quote" aria-label="Quote" onMouseDown={(e) => editorButtonMouseDown(e, "quote")}>❝</button>
                            <button type="button" title="Attach file" aria-label="Attach file" onMouseDown={(e) => editorButtonMouseDown(e, "attachment")}>📎</button>
                            <button type="button" title="Insert web link" aria-label="Insert web link" onMouseDown={(e) => editorButtonMouseDown(e, "link")}>🔗</button>
                            <button type="button" title="Code block" aria-label="Code block" onMouseDown={(e) => editorButtonMouseDown(e, "code")}>&lt;/&gt;</button>
                            <button type="button" title="Mention" aria-label="Mention" onMouseDown={(e) => editorButtonMouseDown(e, "mention")}>@</button>
                            <button type="button" title="Emoji" aria-label="Emoji" onMouseDown={(e) => editorButtonMouseDown(e, "emoji")}>☺</button>
                          </div>

                          {showEmojiPicker && (
                            <div className="emojiPicker" onMouseDown={(e) => e.preventDefault()}>
                              {["😀","🙂","😊","😂","😍","👍","👏","🎉","💡","✅"].map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  aria-label={`Insert ${emoji}`}
                                  onClick={() => insertEmoji(emoji)}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}

                          <div
                            ref={descriptionRef}
                            className="richTextEditor"
                            contentEditable
                            suppressContentEditableWarning
                            data-placeholder="Write the details here..."
                            onInput={syncDescriptionFromEditor}
                            onKeyDown={handleEditorKeyDown}
                            onKeyUp={saveEditorSelection}
                            onMouseUp={saveEditorSelection}
                            onFocus={saveEditorSelection}
                          />
                          <input
                            ref={attachmentInputRef}
                            className="editorAttachmentInput"
                            type="file"
                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.ppt,.pptx,.txt,.zip"
                            onChange={handleFile}
                          />
                          {draft.attachmentName && (
                            <div className="editorAttachmentPreview">
                              <span>📎</span>
                              <b>{draft.attachmentName}</b>
                              <button
                                type="button"
                                aria-label="Remove attachment"
                                onClick={() => {
                                  setDraft((current) => ({
                                    ...current,
                                    attachmentName: "",
                                  }));

                                  if (attachmentInputRef.current) {
                                    attachmentInputRef.current.value = "";
                                  }
                                }}
                              >
                                ×
                              </button>
                            </div>
                          )}
                        </div></label>{draft.type==="RESOURCE"&&<label>Resource link<input value={draft.resourceUrl} onChange={e=>setDraft(d=>({...d,resourceUrl:e.target.value}))} placeholder="https://..."/></label>}<label>Tags<input value={draft.tags} onChange={e=>setDraft(d=>({...d,tags:e.target.value}))} placeholder="BigQuery, GCP, DataEngineering"/></label></>}</div>}
      {createStep===3&&<div className="formStack"><div className="audienceIntro"><span>🎯</span><div><b>Target the right audience</b><p>Select a community first, then choose exactly who receives the post: full tenant, department, programme, course, batch, cohort or group.</p></div></div><label>Community *<select value={draft.communityId} onChange={e=>setDraft(d=>({...d,communityId:e.target.value,scopeId:""}))}><option value="">Select community</option>{communities.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Target Audience *<select value={draft.scopeId} onChange={e=>setDraft(d=>({...d,scopeId:e.target.value}))} disabled={!draft.communityId}><option value="">Select audience</option>{availableScopes.map(s=><option key={s.id} value={s.id}>{s.label} · {s.type}</option>)}</select></label><div className="audienceCards">{availableScopes.map(s=><button key={s.id} className={draft.scopeId===s.id?"selected":""} onClick={()=>setDraft(d=>({...d,scopeId:s.id}))}><span>{s.type==="TENANT"?"🏛️":s.type==="DEPARTMENT"?"🏢":s.type==="BATCH"?"👥":s.type==="COURSE"?"📘":"🎯"}</span><b>{s.label}</b><small>{s.type}</small></button>)}</div></div>}
      {createStep===4&&draft.type&&<div className="previewPost"><div className="previewTop"><span className={`postType ${POST_LABELS[draft.type].color}`}>{POST_LABELS[draft.type].icon} {POST_LABELS[draft.type].label}</span><span>{draftCommunity?.name}</span></div><h3>{draft.type==="POLL"?draft.pollQuestion:draft.title}</h3>{draft.type === "POLL" ? <p>Vote below and share your opinion.</p> : <div className="previewDescription richTextOutput" dangerouslySetInnerHTML={{ __html: draft.description }} />}{draft.tags&&<div className="tagRow">{draft.tags.split(",").map(x=>x.trim()).filter(Boolean).map(t=><span key={t}>#{t}</span>)}</div>}<div className="previewAudience"><span><small>Community</small><b>{draftCommunity?.name}</b></span><span><small>Target Audience</small><b>{availableScopes.find(s=>s.id===draft.scopeId)?.label}</b></span></div>{draft.type==="POLL"&&<div className="previewPollOptions">{draft.pollOptions.filter(Boolean).map((o,i)=><div key={i}>○ {o}</div>)}</div>}<div className="filePublishRow"><label className="uploadButton">📎 {draft.attachmentName||"Add file (optional)"}<input type="file" onChange={handleFile}/></label><small>You can publish directly without a file.</small></div></div>}
      </div>{createStep>1&&<footer className="modalFooter"><button className="softButton" onClick={()=>setCreateStep(Math.max(1,createStep-1) as CreateStep)}>Back</button>{createStep<4?<button className="primaryButton" onClick={nextCreate}>Next</button>:<button className="primaryButton" onClick={publishPost}>Publish Post</button>}</footer>}</section></div>}

    {reportTarget&&<div className="modalBackdrop"><section className="reportModal"><header className="modalHeader"><div><p className="eyebrow">Safety & moderation</p><h2>Report {reportTarget.kind==="POST"?"Post":"Reply"}</h2><small>{reportTarget.title}</small></div><button onClick={()=>setReportTarget(null)}>×</button></header><div className="modalBody"><p className="reportQuestion">Why are you reporting this?</p><div className="reportReasons">{REPORT_REASONS.map(r=><label key={r}><input type="radio" checked={reportReason===r} onChange={()=>setReportReason(r)}/><span>{r}</span></label>)}</div><label className="reportDetails">Additional details<textarea value={reportDetails} onChange={e=>setReportDetails(e.target.value)} placeholder="Please provide more information..."/></label></div><footer className="modalFooter"><button className="softButton" onClick={()=>setReportTarget(null)}>Cancel</button><button className="primaryButton" onClick={submitReport}>Submit Report</button></footer></section></div>}

    {toast&&<div className="toast">{toast}</div>}
  </main>;
}
