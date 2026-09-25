// Every non-GoHighLevel workflow Volvo supplied, READ OFF HIS OWN SCREENSHOTS.
// (GoHighLevel lives in ghldata.mjs.)
//
// Same rule as GoHighLevel: the steps are his, labelled as his builder labels
// them. Two honest differences in what the screenshots give:
//
//   * n8n screenshots show the canvas with the workflow's NAME cropped off, and
//     Make.com screenshots have the scenario name deliberately BLURRED (client
//     names). Those are titled from their own step names, and the page says so.
//     Where the name IS visible it is used exactly (`named: true`).
//   * Make.com modules are "App: action" - e.g. "Close CRM: Search Leads" -
//     because the app name alone repeats. Where he renamed a module ("Translate
//     to English", "Send Lead Magnet") his rename is used as it is.
//
// Client names and phone numbers are withheld throughout.
//
// kind: trigger | action (default) | decision | wait | end | fail
// An edge marked `back` is a loop - drawn round the side, never used for the
// layout, so a retry cannot pull a step back up the page.

const S = (label, kind) => ({ label, kind });

/* ═══ n8n · 002 N8N WORKFLOWS.pdf ═══════════════════════════════════════ */
export const N8N = [
  {
    key: "n8n-thursday", group: "clock",
    name: "Send Reminders Every Thursday 9AM EST",
    does: "Every Thursday morning a reminder goes to the team in Slack, reworded each week so people keep reading it.",
    note: "The randomiser is the point. The same words every week stop being read by about the fourth one.",
    nodes: {
      t: S("Send Reminders Every Thursday 9AM EST", "trigger"),
      a: S("Convert Message to Clean Format"),
      b: S("Randomize Message Every Week"),
      c: S("Send a message (Slack)", "end")
    },
    edges: [["t", "a"], ["a", "b"], ["b", "c"]]
  },
  {
    key: "n8n-upsert", group: "form",
    name: "Form to GHL Contact Upsert",
    does: "A form posts in, the answers are tidied, and the contact is created or updated in GoHighLevel. Nobody retypes anything.",
    nodes: {
      t: S("Webhook", "trigger"),
      a: S("Edit Fields"),
      b: S("GHL UPSERT", "end")
    },
    edges: [["t", "a"], ["a", "b"]]
  },
  {
    key: "n8n-book", group: "form",
    name: "Upsert the Contact, Book the Appointment",
    does: "The same, and then it books the appointment, answering success and failure down two separate paths.",
    note: "Most builds treat an error as nothing happening. This one reports a failed booking as a failure.",
    nodes: {
      t: S("Webhook", "trigger"),
      a: S("Edit Fields"),
      b: S("GHL UPSERT"),
      c: S("contact_id"),
      d: S("Book Appointment", "decision"),
      ok: S("Success", "end"),
      no: S("Error Book Appointment", "fail")
    },
    edges: [["t", "a"], ["a", "b"], ["b", "c"], ["c", "d"], ["d", "ok", "Success"], ["d", "no", "Error"]]
  },
  {
    key: "n8n-runway", group: "form",
    name: "Form Answer to Finished RunwayML Video",
    does: "Someone describes a video on a form. It becomes a prompt, RunwayML renders it, and the finished file lands in Google Drive.",
    note: "A render takes minutes. So it waits, checks, and goes back to waiting until the video is actually done.",
    nodes: {
      t: S("Receive data from form submission", "trigger"),
      a: S("Set variables"),
      b: S("Convert to prompt text"),
      c: S("Generate image to video using RunwayML"),
      d: S("Set task id"),
      w: S("Wait", "wait"),
      s: S("Check Status"),
      q: S("If", "decision"),
      dl: S("Download Video"),
      g: S("Save to Google Drive", "end")
    },
    edges: [["t", "a"], ["a", "b"], ["b", "c"], ["c", "d"], ["d", "w"], ["w", "s"], ["s", "q"],
      ["q", "dl", "true"], ["dl", "g"], ["q", "w", "false", "back"]]
  },
  {
    key: "n8n-callback", group: "form",
    name: "Call Back, Only in Business Hours",
    does: "A GHL form comes in at any hour. The AI caller rings them once the office is open, and if a whole day passes the team is told instead.",
    note: "If it is shut it waits fifteen minutes and checks again, but gives up after 24 hours rather than looping forever.",
    nodes: {
      t: S("GHL Form submitted", "trigger"),
      a: S("Record Timestamp"),
      b: S("Wait Until Business Hours", "wait"),
      q: S("Should Proceed or Wait?", "decision"),
      call: S("Retell Make a Call", "end"),
      x: S("Has Expired 24h", "decision"),
      sl: S("Slack", "fail"),
      w: S("Wait 15 Min", "wait")
    },
    edges: [["t", "a"], ["a", "b"], ["b", "q"], ["q", "call", "true"], ["q", "x", "false"],
      ["x", "sl", "true"], ["x", "w", "false"], ["w", "b", "loop", "back"]]
  },
  {
    key: "n8n-postcall", group: "call",
    name: "Retell Post-Call Analysis to Airtable",
    does: "When the AI finishes a call, its analysis is logged, and the team hears about it only if the details it needed were collected.",
    nodes: {
      t: S("Fetch Post Call Analysis", "trigger"),
      f: S("Forward if call_analyzed", "decision"),
      l: S("Log Call Details (Airtable)"),
      q: S("If Necessary Details Collected", "decision"),
      s: S("Send Slack Message", "end"),
      h: S("HTTP Request", "end")
    },
    edges: [["t", "f"], ["f", "l", "Kept"], ["l", "q"], ["q", "s", "true"], ["q", "h", "false"]]
  },
  {
    key: "n8n-lookup", group: "call",
    name: "Inbound Caller Lookup",
    does: "A call rings in. The number is looked up and the caller's details go back before the call connects.",
    nodes: {
      t: S("Retrieve inbound details", "trigger"),
      a: S("Search phone number (Airtable)"),
      b: S("Set Variables"),
      c: S("Respond to Webhook", "end")
    },
    edges: [["t", "a"], ["a", "b"], ["b", "c"]]
  },
  {
    key: "n8n-list", group: "called",
    name: "Collect a Long List, No Duplicates",
    does: "Called by other workflows. It pages through a long list, drops duplicates twice, and writes the clean result to Google Sheets.",
    note: "Duplicates are removed before and after the detail is fetched, because the second fetch can bring back repeats the first could not see.",
    nodes: {
      t: S("Execute Workflow Trigger", "trigger"),
      h: S("HTTP Request"),
      c: S("Code"),
      f: S("Filter", "decision"),
      d: S("Remove Duplicates"),
      l1: S("Loop Over Items", "decision"),
      h1: S("HTTP Request1"),
      l2: S("Loop Over Items1", "decision"),
      c1: S("Code1"),
      ag: S("Aggregate"),
      so: S("Split Out"),
      d1: S("Remove Duplicates1"),
      gs: S("Google Sheets", "end")
    },
    edges: [["t", "h"], ["h", "c"], ["c", "f"], ["f", "d", "Kept"], ["d", "l1"],
      ["l1", "h1", "loop"], ["h1", "l1", "", "back"], ["l1", "l2", "done"],
      ["l2", "c1", "loop"], ["c1", "l2", "", "back"], ["l2", "ag", "done"],
      ["ag", "so"], ["so", "d1"], ["d1", "gs", "Kept"]]
  },
  {
    key: "n8n-script", group: "clock",
    name: "Viral Video to a New Script",
    does: "On a schedule it scrapes videos, skips any already seen, transcribes the new ones, works out why they worked, researches, and writes a fresh script.",
    note: "The check against existing entries comes before anything is downloaded, so no video is ever paid for twice.",
    nodes: {
      t: S("Schedule Trigger", "trigger"),
      r: S("Run Actor Synchronously (Apify)"),
      l: S("Limit"),
      s: S("Search for Entries (Sheets)"),
      d: S("Drop Duplicates", "decision"),
      a: S("Add Entries"),
      dv: S("Download Video"),
      tr: S("Transcribe Video"),
      fg: S("Filter & Generate Suggestions"),
      p: S("Search Perplexity"),
      w: S("Write New Script"),
      u: S("Update Entries", "end")
    },
    edges: [["t", "r"], ["r", "l"], ["l", "s"], ["l", "d", "Input 1"], ["s", "d", "Input 2"],
      ["d", "a"], ["a", "dv"], ["dv", "tr"], ["tr", "fg"], ["fg", "p"], ["p", "w"], ["w", "u"]]
  }
];

export const N8N_GROUPS = [
  { key: "form", label: "When a form is filled in" },
  { key: "call", label: "When a call happens" },
  { key: "clock", label: "On a schedule" },
  { key: "called", label: "When another workflow calls it" }
];

/* ═══ Make.com · 005 MAKE.COM.pdf (006 is a rescan of the same) ══════════ */
export const MAKE = [
  {
    key: "mk-thursday", group: "clock", named: true,
    name: "Every Thursday Reminder for the Photography Team",
    does: "A weekly Slack reminder for the photography team, reworded by AI each time.",
    nodes: {
      t: S("Set Slack Message Reminders", "trigger"),
      a: S("Convert to JSON (OpenAI)"),
      b: S("JSON: Parse JSON"),
      c: S("Randomizer (OpenAI)"),
      d: S("Send Message (Slack)", "end")
    },
    edges: [["t", "a"], ["a", "b"], ["b", "c"], ["c", "d"]]
  },
  {
    key: "mk-datetime", group: "call", named: true,
    name: "1.1 Retell checkDateTime",
    does: "The AI voice agent asks what time it is. This answers in Eastern time, so it never offers a slot that has already passed.",
    nodes: {
      t: S("Retrieve user query", "trigger"),
      a: S("Get (now) date & time"),
      b: S("Format to EST time (OpenAI)"),
      c: S("Send response", "end")
    },
    edges: [["t", "a"], ["a", "b"], ["b", "c"]]
  },
  {
    key: "mk-outbound", group: "clock", named: true,
    name: "1.2 Outbound Call",
    does: "Every 15 minutes it finds who to call, skips anyone already called, reads the real calendar for open slots, and has the AI place the call.",
    note: "It reads the actual GHL calendar before dialling, so the agent can offer a time that genuinely exists.",
    nodes: {
      t: S("Search for user", "trigger"),
      a: S("Search for duplicates", "decision"),
      b: S("Add new user"),
      c: S("Retrieve Start Time"),
      d: S("Retrieve End Time"),
      e: S("Get GHL Calendar available slots"),
      f: S("Set variables for Retell"),
      g: S("Make a call", "end")
    },
    edges: [["t", "a"], ["a", "b", "Only if new lead"], ["b", "c"], ["c", "d"], ["d", "e"], ["e", "f"], ["f", "g"]]
  },
  {
    key: "mk-apify", group: "call", named: true,
    name: "Apify: Real Estate Offices",
    does: "Runs a scraper, waits for it to finish, and adds only the offices that are not already on file.",
    nodes: {
      t: S("Run scraper", "trigger"),
      a: S("Wait time", "wait"),
      b: S("Retrieve data"),
      c: S("Search for duplicates", "decision"),
      d: S("Create Record", "end")
    },
    edges: [["t", "a"], ["a", "b"], ["b", "c"], ["c", "d", "Prevent duplicates"]]
  },
  {
    key: "mk-translate", group: "clock",
    name: "Ad Copy in English, German and French",
    does: "Ad copy is translated three ways and each language is written back to its own column in the sheet.",
    nodes: {
      t: S("Search AD Copy Column", "trigger"),
      a: S("Translate to English"),
      b: S("Translate to German"),
      c: S("Translate to French"),
      d: S("Transfer Data to Gsheets"),
      r: S("Router", "decision"),
      en: S("English to Column 2"),
      de: S("German to Column 2"),
      fr: S("French to Column 2"),
      g1: S("Transfer Data to Gsheets", "end"),
      g2: S("Transfer Data to Gsheets", "end"),
      g3: S("Transfer Data to Gsheets", "end")
    },
    edges: [["t", "a"], ["a", "b"], ["b", "c"], ["c", "d"], ["d", "r"],
      ["r", "en"], ["r", "de"], ["r", "fr"], ["en", "g1"], ["de", "g2"], ["fr", "g3"]]
  },
  {
    key: "mk-analyse", group: "clock",
    name: "Ad Copy Analysis into Google Sheets",
    does: "Every 15 minutes new ad copy is read by AI and its verdict is written back into the sheet as columns you can sort.",
    nodes: {
      t: S("Search for AD copy column to be translated", "trigger"),
      a: S("Analyze AD Copy Data"),
      b: S("Convert to JSON"),
      c: S("Update Column 1"),
      d: S("Analyze AD Copy Data"),
      e: S("Convert to JSON"),
      f: S("Update Column 2", "end")
    },
    edges: [["t", "a"], ["a", "b"], ["b", "c"], ["c", "d"], ["d", "e"], ["e", "f"]]
  },
  {
    key: "mk-sku", group: "clock",
    name: "A Drive Folder for Every Product",
    does: "Each afternoon it checks every product row and creates a Google Drive folder only where one does not exist yet.",
    nodes: {
      t: S("Search for Row Data", "trigger"),
      a: S("Google Drive: Search for Files/Folders"),
      r: S("Router", "decision"),
      c: S("Create Folder for SKU-Product Name", "end"),
      s: S("Tools: Sleep", "wait"),
      b: S("Break", "fail")
    },
    edges: [["t", "a"], ["a", "r"], ["r", "c", "Create Folder"], ["r", "s", "Ignore Create Folder"], ["s", "b"]]
  },
  {
    key: "mk-leadsheet", group: "clock",
    name: "New Leads into Close CRM, Team Told in Slack",
    does: "Leads from a sheet are checked against Close CRM. Known ones get a note; new ones are created and announced in Slack.",
    nodes: {
      t: S("Google Sheets: Search Rows", "trigger"),
      a: S("Close CRM: Search Leads"),
      r: S("Router", "decision"),
      e: S("Close CRM: Create a Custom Activity", "end"),
      s: S("Tools: Sleep", "wait"),
      c: S("Close CRM: Create a Lead"),
      sl: S("Slack: Create a Message", "end")
    },
    edges: [["t", "a"], ["a", "r"], ["r", "e", "Existing Lead"], ["r", "s", "New Lead"], ["s", "c", "New Lead"], ["c", "sl", "15K Program"]]
  },
  {
    key: "mk-typeform", group: "form",
    name: "Typeform Leads into Close CRM and ActiveCampaign",
    does: "Partial and complete Typeform answers are handled differently, landing in Close CRM and ActiveCampaign with the right tags.",
    note: "A half-filled form and a finished one are not the same lead, so they never share a route.",
    nodes: {
      t: S("Typeform: Watch Responses", "trigger"),
      r: S("Router", "decision"),
      ghl: S("Send to GHL: Make a request"),
      ign: S("Ignore", "fail"),
      sl: S("Close CRM: Search Leads"),
      r2: S("Router", "decision"),
      ex: S("Close CRM: Create a Custom Activity", "end"),
      nl: S("Close CRM: Create a Lead"),
      na: S("Close CRM: Create a Custom Activity"),
      ac1: S("ActiveCampaign: Create or Update a Contact"),
      ac2: S("ActiveCampaign: Add a tag to a Contact", "end"),
      sp: S("Tools: Sleep", "wait"),
      cs: S("Close CRM: Search Leads"),
      ca: S("Close CRM: Create a Custom Activity"),
      as: S("ActiveCampaign: Search Contacts", "decision"),
      at: S("ActiveCampaign: Add a tag to a Contact"),
      b1: S("Break", "end"),
      b2: S("Break", "fail")
    },
    edges: [["t", "r"], ["r", "ghl", "Partial Response"], ["ghl", "ign", "on error"], ["ghl", "sl"],
      ["sl", "r2"], ["r2", "ex", "Existing Lead"], ["r2", "nl", "New Lead"], ["nl", "na"], ["na", "ac1"], ["ac1", "ac2"],
      ["r", "sp", "Complete Response"], ["sp", "cs"], ["cs", "ca"], ["ca", "as"],
      ["as", "at", "Exact Match"], ["at", "b1"], ["as", "b2", "on error"]]
  },
  {
    key: "mk-booking", group: "call",
    name: "Booking Changes Written to Close CRM",
    does: "A booking is cancelled, started or rescheduled. Each change is found, updated and noted on the right lead in Close CRM.",
    nodes: {
      t: S("Webhooks: Custom webhook", "trigger"),
      v: S("close_id & user_id"),
      r: S("Router", "decision"),
      c1: S("Close CRM: Get a Contact"),
      c2: S("Close CRM: Update a Lead", "end"),
      s1: S("Close CRM: Get a Contact"),
      s2: S("Close CRM: Update a Lead"),
      s3: S("Close CRM: Create a Note Activity", "end"),
      r1: S("Close CRM: Get a Contact"),
      r2: S("Close CRM: Update a Lead"),
      r3: S("Close CRM: Create a Note Activity", "end")
    },
    edges: [["t", "v"], ["v", "r"], ["r", "c1", "Canceled"], ["c1", "c2"],
      ["r", "s1", "Started"], ["s1", "s2"], ["s2", "s3"],
      ["r", "r1", "Rescheduled"], ["r1", "r2"], ["r2", "r3"]]
  },
  {
    key: "mk-phones", group: "clock",
    name: "Phone Numbers Cleaned into Google Sheets",
    does: "Every 15 minutes it pulls records, puts every phone number into one national format, and adds them to a sheet.",
    nodes: {
      t: S("HTTP: Make a request", "trigger"),
      i: S("Iterator"),
      h: S("HTTP: Make a request"),
      j: S("JSON: Parse JSON"),
      p: S("Phone number: Parse a phone number"),
      v: S("Tools: Set variable"),
      s: S("Tools: Sleep", "wait"),
      g: S("Google Sheets: Add a Row", "end")
    },
    edges: [["t", "i"], ["i", "h"], ["h", "j"], ["j", "p", "Convert to national format"], ["p", "v"], ["v", "s"], ["s", "g"]]
  },
  {
    key: "mk-instagram", group: "clock",
    name: "Daily Instagram Posts, Captioned by AI",
    does: "Each morning it takes the next image from a sheet, has AI look at it and write the caption, and posts it to Instagram.",
    nodes: {
      t: S("Google Sheets: Search Rows", "trigger"),
      a: S("OpenAI: Analyze Images (Vision)"),
      b: S("Google Sheets: Update a Row"),
      c: S("Tools: Sleep", "wait"),
      d: S("Instagram for Business: Create a photo post", "end")
    },
    edges: [["t", "a", "Ready for Posting"], ["a", "b", "Output"], ["b", "c"], ["c", "d"]]
  },
  {
    key: "mk-pinterest", group: "clock",
    name: "Pinterest Pins, Captioned by AI",
    does: "The same idea for Pinterest: AI reads each image, writes the pin, and it is posted on a 15-minute clock.",
    nodes: {
      t: S("Google Sheets: Search Rows", "trigger"),
      a: S("OpenAI: Analyze Images (Vision)"),
      b: S("OpenAI: Analyze Images (Vision)"),
      c: S("Google Sheets: Update a Row"),
      d: S("Tools: Sleep", "wait"),
      e: S("Pinterest: Create a Pin", "end")
    },
    edges: [["t", "a"], ["a", "b", "Ready for Posting"], ["b", "c", "Output"], ["c", "d"], ["d", "e"]]
  },
  {
    key: "mk-rss", group: "clock",
    name: "News to LinkedIn Post",
    does: "New articles from a feed get a post written by AI, published to LinkedIn and kept as a Google Doc.",
    nodes: {
      t: S("RSS: Watch RSS feed items", "trigger"),
      a: S("OpenAI: Create a Completion"),
      r: S("Router", "decision"),
      l: S("LinkedIn: Create a User Text Post", "end"),
      g: S("Google Docs: Create a Document", "end")
    },
    edges: [["t", "a"], ["a", "r"], ["r", "l", "1st"], ["r", "g", "2nd"]]
  },
  {
    key: "mk-magnet", group: "form",
    name: "Typeform Answers into a Personal Lead Magnet",
    does: "Someone answers a Typeform. AI writes their version of a presentation from a template, and the share link is emailed to them.",
    note: "It is built from their own answers, not a template with their name dropped in.",
    nodes: {
      t: S("Typeform: Watch Responses", "trigger"),
      a: S("Tools: Sleep", "wait"),
      b: S("Typeform: List Responses"),
      c: S("Generate Variables (OpenAI)"),
      d: S("JSON: Parse JSON"),
      e: S("Lead Magnet: Create a Presentation From a Template"),
      f: S("Get Sharable Link"),
      g: S("Send Lead Magnet", "end")
    },
    edges: [["t", "a"], ["a", "b"], ["b", "c"], ["c", "d"], ["d", "e"], ["e", "f"], ["f", "g"]]
  },
  {
    key: "mk-pandadoc", group: "form",
    name: "Tally Form to PandaDoc, Filed in Drive",
    does: "A Tally form answer creates a PandaDoc document, which is downloaded, filed in Google Drive and logged in a sheet.",
    nodes: {
      t: S("Tally: Watch New Responses", "trigger"),
      a: S("PandaDoc: Create a Document"),
      b: S("PandaDoc: Download a Document"),
      c: S("Google Drive: Upload a File"),
      d: S("Google Sheets: Add a Row", "end")
    },
    edges: [["t", "a"], ["a", "b"], ["b", "c", "Upload File"], ["c", "d"]]
  },
  {
    key: "mk-word", group: "form",
    name: "Tally Form to Word Documents, Sent by Outlook",
    does: "A form answer fills a Word template, the documents are filed in OneDrive, and two different emails go out through Outlook.",
    partial: "The module actions are too small to read in the screenshot, so each step is shown by its app. The shape and order are exact.",
    nodes: {
      t: S("Tally", "trigger"),
      a: S("Tools"), b: S("OneDrive"), c: S("Tools"),
      d: S("Microsoft Word Templates"),
      e: S("Tools"), f: S("OneDrive"), g: S("OneDrive"), h: S("OneDrive"), i: S("Tools"), j: S("OneDrive"),
      r: S("Router", "decision"),
      x1: S("Tools"), m1: S("Microsoft 365 Email (Outlook)"), n1: S("Microsoft 365 Email (Outlook)", "end"),
      x2: S("Tools"), m2: S("Microsoft 365 Email (Outlook)"), n2: S("Microsoft 365 Email (Outlook)", "end")
    },
    edges: [["t", "a"], ["a", "b"], ["b", "c"], ["c", "d"], ["d", "e"], ["e", "f"], ["f", "g"], ["g", "h"],
      ["h", "i"], ["i", "j"], ["j", "r"], ["r", "x1"], ["x1", "m1"], ["m1", "n1"], ["r", "x2"], ["x2", "m2"], ["m2", "n2"]]
  },
  {
    key: "mk-textemail", group: "call",
    name: "Write the Text and the Email, Send by Gmail",
    does: "One event produces both a short text message and a longer email, written by AI, and the email goes out through Gmail.",
    nodes: {
      t: S("Webhooks: Custom webhook", "trigger"),
      a: S("Write Text Message"),
      b: S("Write Email"),
      c: S("Gmail: Send an Email", "end")
    },
    edges: [["t", "a"], ["a", "b"], ["b", "c"]]
  },
  {
    key: "mk-mailer", group: "clock",
    name: "Scheduled Emails from a Google Sheet",
    does: "Every 15 minutes it reads the next rows, fills in the blanks, pauses between sends, and emails through Gmail.",
    note: "The pause is deliberate. Sent all at once it looks like a blast and gets treated like one.",
    nodes: {
      t: S("Google Sheets: Search Rows", "trigger"),
      a: S("Tools: Set multiple variables"),
      b: S("Tools: Sleep", "wait"),
      c: S("Gmail: Send an Email", "end")
    },
    edges: [["t", "a"], ["a", "b"], ["b", "c"]]
  }
];

export const MAKE_GROUPS = [
  { key: "form", label: "When a form is answered" },
  { key: "call", label: "When another system calls in" },
  { key: "clock", label: "On a schedule" }
];

/* ═══ Retell · 001 RETELL AI VOICE AGENTS.pdf ═══════════════════════════ */
export const RETELL = [
  {
    key: "rt-ashley", group: "agent", named: true, deep: "retell-agent.html",
    name: "Ashley Cold Calling",
    does: "An AI voice agent that phones real estate agents, finds out how they market listings, and hands interested ones to a person.",
    note: "It asks permission before anything else, keeps a separate exit for 'never call again', and writes 13 notes during every call so nobody has to listen back.",
    nodes: {
      intro: S("Intro Permission To Speak", "trigger"),
      media: S("Use Of Professional Media"),
      callback: S("Callback Requested", "end"),
      dnc: S("DNC Exit", "fail"),
      qualify: S("Qualify Current Provider"),
      showcase: S("Identify Listing Showcase"),
      reject: S("Rejection Handler"),
      zero: S("Create Interest From Zero"),
      value: S("Value Proposition"),
      close: S("Soft Close", "end")
    },
    edges: [["intro", "media"], ["intro", "callback"], ["intro", "dnc"],
      ["media", "qualify"], ["media", "showcase"], ["media", "reject"],
      ["qualify", "zero"], ["showcase", "zero"], ["showcase", "value"], ["reject", "value"],
      ["zero", "close"], ["value", "close"]]
  }
];
export const RETELL_GROUPS = [{ key: "agent", label: "AI voice agent" }];

/* ═══ Intercom · 007 INTERCOM CHATBOT SET-UP.pdf ════════════════════════ */
export const INTERCOM = [
  {
    key: "ic-chat", group: "chat", deep: "website-chat.html",
    name: "Website Chat: Book a Shoot",
    does: "A visitor lands on the site. The chat greets them, shows the packages, and books the shoot without a person. 144 opened it, 11 booked.",
    note: "Four ways in from the greeting, and every package leads to the same booking question, so no route is a dead end.",
    nodes: {
      t: S("When customer visits a page", "trigger"),
      g: S("Greetings", "decision"),
      b: S("Collect Details - Book a shoot"),
      s: S("Ask for services", "decision"),
      c: S("Collect Data - Talk to someone"),
      p1: S("Essentials Package"), p2: S("Highlight Package"), p3: S("Zillow Showcase Package"),
      p4: S("AI Virtual Package"), p5: S("Social Media Package"), p6: S("Matterport Package"),
      p7: S("Lot & Land Bundle"), p8: S("A La Carte"),
      yn: S("Book a shoot Yes or No", "decision"),
      yes: S("Book a shoot - Yes"),
      no: S("Book a shoot - No"),
      close: S("Close path", "end")
    },
    edges: [["t", "g"], ["g", "b", "Book a shoot"], ["g", "s", "Our services"], ["g", "c", "Talk to someone"],
      ["s", "p1"], ["s", "p2"], ["s", "p3"], ["s", "p4"], ["s", "p5"], ["s", "p6"], ["s", "p7"], ["s", "p8"],
      ["p1", "yn"], ["p2", "yn"], ["p3", "yn"], ["p4", "yn"], ["p5", "yn"], ["p6", "yn"], ["p7", "yn"], ["p8", "yn"],
      ["b", "yn"], ["yn", "yes", "Yes"], ["yn", "no", "No"], ["yes", "close"], ["no", "close"], ["c", "close"]]
  }
];
export const INTERCOM_GROUPS = [{ key: "chat", label: "Website chat" }];

/* ═══ OpenPhone · 008 OPENPHONE SONA AI SET-UP.pdf ══════════════════════ */
export const OPENPHONE = [
  {
    key: "op-flow", group: "phone", named: true, deep: "call-routing.html",
    name: "Default call flow",
    does: "When the phone rings, everyone's phone rings at once for 15 seconds in office hours. Missed, or after hours, the Sona AI answers and takes a message.",
    note: "No caller ever reaches a voicemail box. A person or the AI always picks up.",
    nodes: {
      t: S("Incoming call", "trigger"),
      bh: S("Business hours", "decision"),
      ring: S("Ring users: all at once, 15s"),
      sa: S("Sona: let Sona handle calls", "end"),
      sm: S("Sona: let Sona handle calls", "end")
    },
    edges: [["t", "bh"], ["bh", "ring", "During hours"], ["bh", "sa", "After hours"], ["ring", "sm", "If call is missed"]]
  }
];
export const OPENPHONE_GROUPS = [{ key: "phone", label: "Phone system" }];
