export type TranslationSchema = {
  tagline: string
  skipToContent: string
  common: {
    all: string
    online: string
    offline: string
    search: string
    searching: string
    open: string
    back: string
    continue: string
    submit: string
    details: string
    viewDetails: string
    removeFile: string
    copied: string
    copy: string
    viewMap: string
    none: string
    loading: string
    retry: string
    close: string
    charsMin: string
    stepOf: string
    live: string
    table: string
    cards: string
  }
  utility: {
    language: string
    switchLanguage: string
    accessibility: string
    textSize: string
    help: string
    contacts: string
  }
  nav: {
    home: string
    services: string
    report: string
    track: string
    map: string
    transparency: string
    departments: string
    help: string
    aiAssistant: string
    signIn: string
    admin: string
    officer: string
    dashboard: string
    menu: string
    closeMenu: string
    maintenanceIntelligence: string
    workOrders: string
    civicIntelligence: string
  }
  hero: {
    title: string
    subtitle: string
    cta1: string
    cta2: string
    note: string
    badgeComplaints: string
    badgeCompliance: string
  }
  quickActions: {
    report: { title: string; desc: string; action: string }
    track: { title: string; desc: string; action: string }
    map: { title: string; desc: string; action: string }
    chat: { title: string; desc: string; action: string }
    transparency: { title: string; desc: string; action: string }
  }
  services: {
    heading: string
    road: { name: string; desc: string }
    garbage: { name: string; desc: string }
    streetlight: { name: string; desc: string }
    water: { name: string; desc: string }
    drainage: { name: string; desc: string }
    traffic: { name: string; desc: string }
    parks: { name: string; desc: string }
    buildings: { name: string; desc: string }
    animal: { name: string; desc: string }
    fire: { name: string; desc: string }
    other: { name: string; desc: string }
  }
  home: {
    recentlyResolved: string
    viewTransparency: string
    platformAccess: string
    platformAccessDesc: string
    departmentRole: { title: string; desc: string }
    adminRole: { title: string; desc: string }
    officerRole: { title: string; desc: string }
  }
  stats: {
    heading: string
    total: string
    resolved: string
    inProgress: string
    resolutionRate: string
    avgTime: string
    slaCompliance: string
    days: string
  }
  report: {
    heading: string
    steps: string[]
    step1: { heading: string; subheading: string }
    step2: {
      heading: string
      subheading: string
      label: string
      placeholder: string
      voice: string
      photo: string
      video: string
    }
    step3: {
      heading: string
      subheading: string
      useGPS: string
      selectMap: string
      search: string
      accuracy: string
      ward: string
      zone: string
      detecting: string
      denied: string
      unavailable: string
    }
    step4: {
      heading: string
      subheading: string
      upload: string
      formats: string
      privacy: string
      blur: string
    }
    step5: {
      heading: string
      anonymous: string
      anonymousDesc: string
      withAccount: string
      withAccountDesc: string
    }
    step6: {
      heading: string
      subheading: string
      aiLabel: string
      aiDisclaimer: string
      confidence: string
      category: string
      severity: string
      department: string
      duplicate: string
      nearbyReports: string
      confirm: string
      change: string
    }
    step7: {
      heading: string
      subheading: string
      summaryCategory: string
      summaryDescription: string
      summaryLocation: string
      summaryWard: string
      summaryEvidence: string
      summaryReportType: string
      summaryAnonymous: string
      summaryWithAccount: string
      submit: string
      back: string
      warning: string
    }
    submitting: string
    success: string
    successDesc: string
    saveNote: string
    copyId: string
    download: string
    trackNow: string
  }
  track: {
    heading: string
    subheading: string
    idLabel: string
    idPlaceholder: string
    pinLabel: string
    pinPlaceholder: string
    cta: string
    searching: string
    samplePrompt: string
    pinHelpNote: string
    notFound: string
    tooManyAttempts: string
    unavailable: string
  }
  complaint: {
    id: string
    category: string
    status: string
    priority: string
    department: string
    officer: string
    location: string
    ward: string
    zone: string
    submitted: string
    updated: string
    sla: string
    slaRemaining: string
    slaBreached: string
    slaHours: string
    timeline: string
    reopen: string
    feedback: string
    detailsHeading: string
    notAssigned: string
    aiRecommendation: string
    aiRoutingDisclaimer: string
  }
  feedback: {
    wasResolved: string
    yesResolved: string
    notResolved: string
    rateExperience: string
    tellUsMore: string
    submitFeedback: string
    thankYou: string
  }
  status: {
    submitted: string
    ai_analysis: string
    assigned: string
    accepted: string
    in_progress: string
    verification: string
    resolved: string
    reopened: string
    closed: string
  }
  priority: {
    low: string
    medium: string
    high: string
    critical: string
  }
  map: {
    heading: string
    subheading: string
    layers: string
    all: string
    filters: string
    date: string
    severity: string
    mapView: string
    listView: string
    legend: string
    low: string
    moderate: string
    high: string
    mediumHigh: string
    critical: string
    noIssues: string
    issuesShown: string
    complaintsFound: string
    viewDetails: string
    layerNames: {
      all: string
      road: string
      garbage: string
      water: string
      drainage: string
      streetlight: string
      traffic: string
    }
  }
  transparency: {
    heading: string
    subheading: string
    total: string
    resolved: string
    inProgress: string
    resolutionRate: string
    avgTime: string
    slaCompliance: string
    trends: string
    byCategory: string
    byDepartment: string
    byWard: string
    reportedSeries: string
    resolvedSeries: string
    complaintsSeries: string
    tableHeaders: {
      department: string
      total: string
      resolved: string
      sla: string
      avgHours: string
    }
    anonymizedNote: string
  }
  dashboard: {
    greeting: string
    subtitle: string
    myComplaints: string
    active: string
    resolved: string
    reopened: string
    all: string
    noComplaints: string
    noComplaintsCta: string
    reportNewIssue: string
  }
  departmentDashboard: {
    title: string
    open: string
    inProgress: string
    slaBreached: string
    slaCompliance: string
    avgResolution: string
    tableHeaders: {
      complaintId: string
      category: string
      ward: string
      priority: string
      officer: string
      sla: string
      status: string
    }
    noMatch: string
  }
  admin: {
    title: string
    liveOperations: string
    overview: string
    total: string
    open: string
    inProgress: string
    resolved: string
    slaBreached: string
    critical: string
    liveAlerts: string
    departmentPerf: string
    slaPerf: string
    issueTrends: string
    aiQueue: string
    aiQueueDesc: string
    aiRecommendationBadge: string
    aiConfidenceLabel: string
    approve: string
    change: string
    escalate: string
    tableHeaders: {
      department: string
      total: string
      open: string
      inProgress: string
      resolved: string
      sla: string
      breached: string
    }
  }
  officer: {
    title: string
    assigned: string
    urgent: string
    dueSoon: string
    completedToday: string
    accept: string
    navigate: string
    startWork: string
    beforePhoto: string
    afterPhoto: string
    submitResolution: string
    aiVerified: string
    aiReview: string
    online: string
    offline: string
    backToList: string
    photoCaptured: string
    afterPhotoCaptured: string
    workCompleteAddPhoto: string
    aiVerifying: string
    aiRecommendationDisclaimer: string
    markResolved: string
    complaintResolved: string
    backToAssignments: string
    myAssignments: string
    steps: {
      assigned: string
      accepted: string
      beforePhoto: string
      working: string
      afterPhoto: string
      aiVerify: string
      resolved: string
    }
  }
  chat: {
    greeting: string
    placeholder: string
    suggested: string
    prompts: string[]
    typing: string
    openAssistant: string
    closeChat: string
    sendMessage: string
    online: string
    disclaimer: string
  }
  accessibility: {
    title: string
    increaseText: string
    decreaseText: string
    highContrast: string
    highlightLinks: string
    lineSpacing: string
    reduceMotion: string
    textToSpeech: string
    reset: string
    closeToolbar: string
  }
  errors: {
    network: string
    server: string
    timeout: string
    offline: string
    session: string
    forbidden: string
    rateLimit: string
    fileTooLarge: string
    invalidFile: string
    retry: string
    duplicate: string
  }
  footer: {
    tagline: string
    platformHeading: string
    servicesHeading: string
    legalHeading: string
    about: string
    services: string
    departments: string
    transparency: string
    reportIssue: string
    trackComplaint: string
    civicMap: string
    aiAssistant: string
    help: string
    accessibility: string
    privacy: string
    terms: string
    security: string
    contact: string
    sitemap: string
    helpline: string
    helplineNote: string
    copyright: string
    disclaimer: string
  }
  camera: {
    title: string
    initializing: string
    capture: string
    retake: string
    usePhoto: string
    photoCaptured: string
    flipCamera: string
    deniedTitle: string
    deniedDesc: string
    unavailableTitle: string
    unavailableDesc: string
    unsupportedDesc: string
    fallbackUpload: string
  }
  uploader: {
    selectPhotoPrompt: string
    aiAnalyzeNote: string
    uploadImage: string
    captureImage: string
    supportedFormats: string
    imageReady: string
    replaceImage: string
    removeImage: string
    analyzePromptTitle: string
    analyzePromptDesc: string
    analyzeWithCivicAI: string
    analyzing: string
    invalidFormatError: string
    fileTooLargeError: string
    imageTooSmallError: string
  }
  aiCard: {
    aiRecommendationBadge: string
    aiDisclaimerNote: string
    confidence: string
    detectedIssueLabel: string
    severityLabel: string
    suggestedDepartmentLabel: string
    routingConfidence: string
    isThisCorrectPrompt: string
    categoryLabel: string
    yesContinue: string
    changeCategory: string
    keepRecommendation: string
    selectCorrectCategory: string
    lowConfidenceBadge: string
    lowConfidenceHeading: string
    lowConfidenceDesc: string
    tryAnotherImage: string
    continueWithDescription: string
    validatingImage: string
    uploadingImage: string
    analyzingWithGemini: string
    processingDesc: string
    timeoutTitle: string
    rateLimitedTitle: string
    errorTitle: string
    genericError: string
    selectCategoryManually: string
    chooseCategory: string
  }
}

export const t: { en: TranslationSchema; ta: TranslationSchema } = {
  en: {
    tagline: "Report. Track. Resolve.",
    skipToContent: "Skip to main content",
    common: {
      all: "All",
      online: "Online",
      offline: "Offline",
      search: "Search",
      searching: "Searching...",
      open: "Open",
      back: "Back",
      continue: "Continue",
      submit: "Submit",
      details: "Details",
      viewDetails: "View Details",
      removeFile: "Remove file",
      copied: "Copied",
      copy: "Copy",
      viewMap: "View Map",
      none: "None",
      loading: "Loading...",
      retry: "Retry safely",
      close: "Close",
      charsMin: "chars (min 10)",
      stepOf: "Step",
      live: "Live",
      table: "Table",
      cards: "Cards",
    },
    utility: {
      language: "தமிழ் | English",
      switchLanguage: "Switch language",
      accessibility: "Accessibility",
      textSize: "Text Size",
      help: "Help",
      contacts: "Important Contacts",
    },
    nav: {
      home: "Home",
      services: "Services",
      report: "Report Issue",
      track: "Track Complaint",
      map: "Civic Map",
      transparency: "Transparency",
      departments: "Departments",
      help: "Help",
      aiAssistant: "AI Assistant",
      signIn: "Sign In",
      admin: "Admin Control Center",
      officer: "Field Officer",
      dashboard: "Citizen Dashboard",
      menu: "Menu",
      closeMenu: "Close menu",
      maintenanceIntelligence: "Maintenance Intelligence",
      workOrders: "Work Orders",
      civicIntelligence: "Civic Intelligence",
    },
    hero: {
      title: "Make Your City Better",
      subtitle:
        "Report civic issues, track progress and see how your community's complaints are being resolved.",
      cta1: "Report an Issue",
      cta2: "Track Complaint",
      note: "Report anonymously. No account required.",
      badgeComplaints: "complaints tracked",
      badgeCompliance: "SLA compliance",
    },
    quickActions: {
      report: {
        title: "Report an Issue",
        desc: "Submit a new civic complaint with AI assistance",
        action: "Report Now",
      },
      track: {
        title: "Track Complaint",
        desc: "Check status with your complaint ID and PIN",
        action: "Track Now",
      },
      map: {
        title: "Civic Map",
        desc: "View live civic issue heatmap for your area",
        action: "View Map",
      },
      chat: {
        title: "Ask CivicAI",
        desc: "Get help from our AI assistant in Tamil or English",
        action: "Start Chat",
      },
      transparency: {
        title: "Transparency Portal",
        desc: "View citywide resolution metrics, department SLAs, and analytics",
        action: "View Analytics",
      },
    },
    services: {
      heading: "Civic Services",
      road: {
        name: "Roads & Footpaths",
        desc: "Report potholes, damaged roads and footpath issues.",
      },
      garbage: {
        name: "Garbage & Sanitation",
        desc: "Overflow, illegal dumping, missed collection.",
      },
      streetlight: {
        name: "Street Lights",
        desc: "Broken, missing, or flickering lights.",
      },
      water: {
        name: "Water Supply",
        desc: "Leakage, supply interruption, low pressure.",
      },
      drainage: {
        name: "Drainage",
        desc: "Blocked drains, waterlogging, sewage overflow.",
      },
      traffic: {
        name: "Traffic & Parking",
        desc: "Signal issues, illegal parking, road markings.",
      },
      parks: {
        name: "Parks & Trees",
        desc: "Fallen trees, park maintenance, green spaces.",
      },
      buildings: {
        name: "Public Buildings",
        desc: "Maintenance of government buildings.",
      },
      animal: {
        name: "Stray Animals & Cattle",
        desc: "Stray cattle, dogs, or dangerous animal control.",
      },
      fire: {
        name: "Fire & Safety Hazard",
        desc: "Fire risks, open wires, combustible hazards.",
      },
      other: {
        name: "Other",
        desc: "Any other civic issue not listed above.",
      },
    },
    home: {
      recentlyResolved: "Recently Resolved",
      viewTransparency: "View transparency data →",
      platformAccess: "Platform Access",
      platformAccessDesc: "Different views for different roles",
      departmentRole: {
        title: "Department Dashboard",
        desc: "Manage complaints & SLA",
      },
      adminRole: {
        title: "Admin Control Center",
        desc: "City-wide oversight & analytics",
      },
      officerRole: { title: "Field Officer", desc: "Mobile field operations" },
    },
    stats: {
      heading: "City in Numbers",
      total: "Total Complaints",
      resolved: "Resolved",
      inProgress: "In Progress",
      resolutionRate: "Resolution Rate",
      avgTime: "Avg. Resolution Time",
      slaCompliance: "SLA Compliance",
      days: "days",
    },
    report: {
      heading: "Report a Civic Issue",
      steps: [
        "Issue Type",
        "Description",
        "Location",
        "Evidence",
        "Privacy",
        "AI Review",
        "Final Review",
      ],
      step1: {
        heading: "What happened?",
        subheading: "Select the category that best describes the issue",
      },
      step2: {
        heading: "Describe the Issue",
        subheading: "Provide details to help our team respond faster",
        label: "Description",
        placeholder:
          "Describe what you see, when it started, and how it affects you...",
        voice: "Voice Input",
        photo: "Attach Photo",
        video: "Attach Video",
      },
      step3: {
        heading: "Where is it?",
        subheading: "Help us locate the issue accurately",
        useGPS: "Use Current Location",
        selectMap: "Select on Map",
        search: "Search Location",
        accuracy: "Location accuracy",
        ward: "Ward",
        zone: "Zone",
        detecting: "Detecting your location...",
        denied: "Location access denied. Please enter manually.",
        unavailable: "GPS unavailable. Please search.",
      },
      step4: {
        heading: "Add Evidence",
        subheading: "Photos help us understand and resolve issues faster",
        upload: "Upload Photo / Video",
        formats: "Accepted: JPEG, PNG, WEBP, MP4 · Max 10MB each",
        privacy: "Do not upload unnecessary personal information.",
        blur: "Automatically blur faces and vehicle number plates.",
      },
      step5: {
        heading: "How do you want to report?",
        anonymous: "Report Anonymously",
        anonymousDesc:
          "No name, phone, or email required. You will receive a Complaint ID and Tracking PIN to follow up.",
        withAccount: "Continue with Account",
        withAccountDesc:
          "Sign in or create an account to track complaints in your dashboard.",
      },
      step6: {
        heading: "AI Recommendation",
        subheading:
          "Our AI has analyzed your report. Please review and confirm.",
        aiLabel: "AI Analysis",
        aiDisclaimer: "AI Recommendation — not a final decision",
        confidence: "Confidence",
        category: "Suggested Category",
        severity: "Suggested Severity",
        department: "Suggested Department",
        duplicate: "Possible Duplicate",
        nearbyReports: "nearby reports",
        confirm: "Confirm & Continue",
        change: "Change",
      },
      step7: {
        heading: "Review & Submit",
        subheading: "Please review your complaint before submitting",
        summaryCategory: "Category",
        summaryDescription: "Description",
        summaryLocation: "Location",
        summaryWard: "Ward",
        summaryEvidence: "Evidence",
        summaryReportType: "Report type",
        summaryAnonymous: "Anonymous",
        summaryWithAccount: "With account",
        submit: "Submit Complaint",
        back: "Back",
        warning: "Please don't close this page while submitting.",
      },
      submitting: "Submitting...",
      success: "Complaint Submitted Successfully",
      successDesc:
        "Your complaint has been registered and assigned a unique ID.",
      saveNote:
        "Save your Complaint ID and Tracking PIN. You will need them to track this complaint.",
      copyId: "Copy Complaint ID",
      download: "Download Receipt",
      trackNow: "Track Complaint",
    },
    track: {
      heading: "Track Your Complaint",
      subheading: "Enter your Complaint ID and Tracking PIN to check status",
      idLabel: "Complaint ID",
      idPlaceholder: "e.g. CIV-2026-8X72KQ",
      pinLabel: "Tracking PIN",
      pinPlaceholder: "6-digit PIN",
      cta: "Track Complaint",
      searching: "Searching...",
      samplePrompt: "Try with a sample complaint:",
      pinHelpNote:
        "PIN is provided when you submit a complaint. Anonymous submissions get a separate PIN.",
      notFound: "Complaint not found. Please check your ID and PIN.",
      tooManyAttempts: "Too many attempts. Please try again after 30 minutes.",
      unavailable: "Service temporarily unavailable. Please try again.",
    },
    complaint: {
      id: "Complaint ID",
      category: "Category",
      status: "Status",
      priority: "Priority",
      department: "Department",
      officer: "Field Officer",
      location: "Location",
      ward: "Ward",
      zone: "Zone",
      submitted: "Submitted",
      updated: "Last Updated",
      sla: "SLA",
      slaRemaining: "SLA Remaining",
      slaBreached: "SLA Breached",
      slaHours: "h SLA",
      timeline: "Status Timeline",
      reopen: "Reopen Complaint",
      feedback: "Give Feedback",
      detailsHeading: "Complaint Details",
      notAssigned: "Not yet assigned",
      aiRecommendation: "AI Recommendation",
      aiRoutingDisclaimer:
        "AI assists routing only. Humans remain accountable.",
    },
    feedback: {
      wasResolved: "Was your issue resolved?",
      yesResolved: "✓ Yes, resolved",
      notResolved: "✗ Not resolved",
      rateExperience: "Rate your experience:",
      tellUsMore: "Tell us what happened (optional)",
      submitFeedback: "Submit Feedback",
      thankYou: "Thank you for your feedback!",
    },
    status: {
      submitted: "Submitted",
      ai_analysis: "AI Analysis",
      assigned: "Assigned",
      accepted: "Officer Accepted",
      in_progress: "In Progress",
      verification: "Verification",
      resolved: "Resolved",
      reopened: "Reopened",
      closed: "Closed",
    },
    priority: {
      low: "Low",
      medium: "Medium",
      high: "High",
      critical: "Critical",
    },
    map: {
      heading: "Civic Issue Map",
      subheading: "Live view of reported civic issues across the city",
      layers: "Layers",
      all: "All",
      filters: "Filters",
      date: "Date Range",
      severity: "Severity",
      mapView: "Map View",
      listView: "List View",
      legend: "Legend",
      low: "Low Density",
      moderate: "Moderate",
      high: "High Density",
      mediumHigh: "Medium / High",
      critical: "Critical",
      noIssues: "No civic issues found in this area.",
      issuesShown: "issues shown",
      complaintsFound: "complaints found",
      viewDetails: "View Details →",
      layerNames: {
        all: "All",
        road: "Roads",
        garbage: "Garbage",
        water: "Water",
        drainage: "Drainage",
        streetlight: "Lights",
        traffic: "Traffic",
      },
    },
    transparency: {
      heading: "How is our city responding?",
      subheading: "Public transparency data — updated daily",
      total: "Total Complaints",
      resolved: "Resolved",
      inProgress: "In Progress",
      resolutionRate: "Resolution Rate",
      avgTime: "Avg. Resolution",
      slaCompliance: "SLA Compliance",
      trends: "Complaint Trends",
      byCategory: "By Category",
      byDepartment: "Department Performance",
      byWard: "Ward Distribution",
      reportedSeries: "Reported",
      resolvedSeries: "Resolved",
      complaintsSeries: "Complaints",
      tableHeaders: {
        department: "Department",
        total: "Total",
        resolved: "Resolved",
        sla: "SLA %",
        avgHours: "Avg (hrs)",
      },
      anonymizedNote:
        "Data is anonymized and does not include any personal citizen information. Updated daily.",
    },
    dashboard: {
      greeting: "Vanakkam",
      subtitle: "Here's an overview of your civic complaints.",
      myComplaints: "My Complaints",
      active: "Active",
      resolved: "Resolved",
      reopened: "Reopened",
      all: "All",
      noComplaints: "You haven't reported any complaints yet.",
      noComplaintsCta: "Report an Issue",
      reportNewIssue: "Report a New Issue",
    },
    departmentDashboard: {
      title: "Department Dashboard",
      open: "Open",
      inProgress: "In Progress",
      slaBreached: "SLA Breached",
      slaCompliance: "SLA Compliance",
      avgResolution: "Avg. resolution",
      tableHeaders: {
        complaintId: "Complaint ID",
        category: "Category",
        ward: "Ward",
        priority: "Priority",
        officer: "Officer",
        sla: "SLA",
        status: "Status",
      },
      noMatch: "No complaints match the selected filter.",
    },
    admin: {
      title: "CivicAI Control Center",
      liveOperations: "Live Operations",
      overview: "Overview",
      total: "Total",
      open: "Open",
      inProgress: "In Progress",
      resolved: "Resolved",
      slaBreached: "SLA Breached",
      critical: "Critical",
      liveAlerts: "Live Alerts",
      departmentPerf: "Department Performance",
      slaPerf: "SLA Performance",
      issueTrends: "Issue Trends",
      aiQueue: "AI Verification Queue",
      aiQueueDesc: "These complaints require human review before processing.",
      aiRecommendationBadge: "AI Recommendation",
      aiConfidenceLabel: "AI Confidence",
      approve: "Approve",
      change: "Change",
      escalate: "Escalate",
      tableHeaders: {
        department: "Department",
        total: "Total",
        open: "Open",
        inProgress: "In Progress",
        resolved: "Resolved",
        sla: "SLA %",
        breached: "Breached",
      },
    },
    officer: {
      title: "Field Officer",
      assigned: "Assigned",
      urgent: "Urgent",
      dueSoon: "Due Soon",
      completedToday: "Completed Today",
      accept: "Accept",
      navigate: "Navigate",
      startWork: "Start Work",
      beforePhoto: "Before Photo",
      afterPhoto: "After Photo",
      submitResolution: "Submit Resolution",
      aiVerified: "AI verification: likely resolved",
      aiReview: "Additional review required",
      online: "Online",
      offline: "Offline",
      backToList: "Back to list",
      photoCaptured: "Photo captured",
      afterPhotoCaptured: "After photo captured",
      workCompleteAddPhoto: "Work Complete — Add After Photo",
      aiVerifying: "AI verifying resolution...",
      aiRecommendationDisclaimer:
        "AI result is a recommendation only. Supervisor may review.",
      markResolved: "Mark as Resolved",
      complaintResolved: "Complaint Resolved!",
      backToAssignments: "Back to assignments",
      myAssignments: "My Assignments",
      steps: {
        assigned: "Assigned",
        accepted: "Accepted",
        beforePhoto: "Before Photo",
        working: "Working",
        afterPhoto: "After Photo",
        aiVerify: "AI Verify",
        resolved: "Resolved",
      },
    },
    chat: {
      greeting: "Vanakkam! How can CivicAI help you?",
      placeholder: "Type a message or question...",
      suggested: "Suggested questions",
      prompts: [
        "Report a pothole",
        "Track my complaint",
        "How do I report garbage?",
        "What happens after I submit?",
      ],
      typing: "CivicAI is typing...",
      openAssistant: "Open AI Assistant",
      closeChat: "Close chat",
      sendMessage: "Send message",
      online: "Online",
      disclaimer: "AI may make mistakes. For urgent issues, call the helpline.",
    },
    accessibility: {
      title: "Accessibility",
      increaseText: "Increase Text",
      decreaseText: "Decrease Text",
      highContrast: "High Contrast",
      highlightLinks: "Highlight Links",
      lineSpacing: "Line Spacing",
      reduceMotion: "Reduce Motion",
      textToSpeech: "Text to Speech",
      reset: "Reset",
      closeToolbar: "Close accessibility toolbar",
    },
    errors: {
      network:
        "We couldn't connect to the service. Please check your connection.",
      server: "Something went wrong. Please try again.",
      timeout: "Request timed out. Please try again.",
      offline: "You are offline. Some features may not be available.",
      session: "Your session has expired. Please sign in again.",
      forbidden: "You are not authorized to view this.",
      rateLimit: "Too many requests. Please wait a moment.",
      fileTooLarge: "File is too large. Maximum size is 10MB.",
      invalidFile: "Invalid file type. Please upload JPEG, PNG, WEBP, or MP4.",
      retry: "Retry safely",
      duplicate:
        "A similar complaint may already exist nearby. Review before submitting.",
    },
    footer: {
      tagline: "AI-Powered Smart Civic Issue Reporting",
      platformHeading: "Platform",
      servicesHeading: "Services",
      legalHeading: "Legal",
      about: "About",
      services: "Services",
      departments: "Departments",
      transparency: "Transparency",
      reportIssue: "Report Issue",
      trackComplaint: "Track Complaint",
      civicMap: "Civic Map",
      aiAssistant: "AI Assistant",
      help: "Help & Support",
      accessibility: "Accessibility",
      privacy: "Privacy Policy",
      terms: "Terms of Use",
      security: "Security",
      contact: "Contact",
      sitemap: "Sitemap",
      helpline: "Official Civic Helpline",
      helplineNote: "Contact information will be published after verification.",
      copyright:
        "© 2026 CivicAI. Tamil Nadu Urban Local Body Digital Services.",
      disclaimer:
        "This is a citizen service portal. All complaints are handled by authorized government departments.",
    },
    camera: {
      title: "Device Camera",
      initializing: "Starting camera stream...",
      capture: "Capture Photo",
      retake: "Retake Photo",
      usePhoto: "Use Photo",
      photoCaptured: "Photo Captured",
      flipCamera: "Switch Camera",
      deniedTitle: "Camera Permission Denied",
      deniedDesc:
        "Camera access was blocked by your browser settings. You can upload an image from your device gallery instead.",
      unavailableTitle: "Camera Unavailable",
      unavailableDesc:
        "No active camera hardware was detected on this device. You can upload an image file instead.",
      unsupportedDesc:
        "Your browser environment does not support real-time camera capture. Please choose an image file.",
      fallbackUpload: "Upload Image Instead",
    },
    uploader: {
      selectPhotoPrompt:
        "Start by uploading or capturing a photo of the civic issue",
      aiAnalyzeNote:
        "Your photo will be securely analyzed by CivicAI to identify category, hazard level, and municipal routing.",
      uploadImage: "Upload Image",
      captureImage: "Capture Image",
      supportedFormats: "Supported formats: JPG, PNG, WEBP (Max 10MB)",
      imageReady: "Image ready for analysis",
      replaceImage: "Replace Image",
      removeImage: "Remove Image",
      analyzePromptTitle: "Ready for AI Vision Analysis",
      analyzePromptDesc:
        "CivicAI will evaluate damage severity and suggest the relevant department",
      analyzeWithCivicAI: "Analyze with CivicAI",
      analyzing: "Analyzing photo...",
      invalidFormatError: "Please upload a valid image (JPEG, PNG, or WEBP).",
      fileTooLargeError:
        "Image is too large. Please choose an image under 10MB.",
      imageTooSmallError:
        "Image dimensions are too small for accurate civic analysis.",
    },
    aiCard: {
      aiRecommendationBadge: "AI Recommendation",
      aiDisclaimerNote: "Subject to administrative review",
      confidence: "Confidence",
      detectedIssueLabel: "Detected Civic Issue",
      severityLabel: "Assessed Hazard Severity",
      suggestedDepartmentLabel: "AI Suggested Department",
      routingConfidence: "Routing Confidence",
      isThisCorrectPrompt: "Is this AI recommendation correct?",
      categoryLabel: "Issue Category",
      yesContinue: "Yes, Continue",
      changeCategory: "Change Category",
      keepRecommendation: "Keep Recommendation",
      selectCorrectCategory: "Select the appropriate category below:",
      lowConfidenceBadge: "Low AI Confidence",
      lowConfidenceHeading: "AI could not confidently classify this issue",
      lowConfidenceDesc:
        "Confidence is below threshold. Please select the category manually so it reaches the right department.",
      tryAnotherImage: "Try Another Image",
      continueWithDescription: "Continue with Description",
      validatingImage: "Validating image integrity...",
      uploadingImage: "Optimizing and preparing image...",
      analyzingWithGemini: "Analyzing photo with CivicAI...",
      processingDesc:
        "Evaluating visual damage, hazard level, and municipal jurisdiction.",
      timeoutTitle: "AI Analysis Timed Out",
      rateLimitedTitle: "Too Many Requests",
      errorTitle: "Analysis Unavailable",
      genericError:
        "CivicAI vision service is temporarily unavailable. You can continue by selecting the category manually.",
      selectCategoryManually: "Select Category Manually",
      chooseCategory: "Choose Issue Category",
    },
  },
  ta: {
    tagline: "புகாரளிக்கவும். கண்காணிக்கவும். தீர்வு காணவும்.",
    skipToContent: "முதன்மை உள்ளடக்கத்திற்கு செல்லவும்",
    common: {
      all: "அனைத்தும்",
      online: "ஆன்லைன்",
      offline: "ஆஃப்லைன்",
      search: "தேடு",
      searching: "தேடுகிறது...",
      open: "திறக்கவும்",
      back: "திரும்பவும்",
      continue: "தொடரவும்",
      submit: "சமர்ப்பிக்கவும்",
      details: "விவரங்கள்",
      viewDetails: "விவரங்கள் பாருங்கள்",
      removeFile: "கோப்பை அகற்றவும்",
      copied: "நகலெடுக்கப்பட்டது",
      copy: "நகலெடு",
      viewMap: "வரைபடம் பாருங்கள்",
      none: "இல்லை",
      loading: "ஏற்றப்படுகிறது...",
      retry: "பாதுகாப்பாக மீண்டும் முயற்சிக்கவும்",
      close: "மூடு",
      charsMin: "எழுத்துகள் (குறைந்தது 10)",
      stepOf: "படி",
      live: "நேரலை",
      table: "அட்டவணை",
      cards: "அட்டைகள்",
    },
    utility: {
      language: "தமிழ் | English",
      switchLanguage: "மொழியை மாற்றவும்",
      accessibility: "அணுகலுரிமை",
      textSize: "எழுத்து அளவு",
      help: "உதவி",
      contacts: "முக்கியத் தொடர்புகள்",
    },
    nav: {
      home: "முகப்பு",
      services: "சேவைகள்",
      report: "புகாரளிக்கவும்",
      track: "புகாரைக் கண்காணிக்கவும்",
      map: "நகர வரைபடம்",
      transparency: "வெளிப்படைத்தன்மை",
      departments: "துறைகள்",
      help: "உதவி",
      aiAssistant: "AI உதவியாளர்",
      signIn: "உள்நுழைக",
      admin: "நிர்வாக கட்டுப்பாட்டு மையம்",
      officer: "களப் பணியாளர்",
      dashboard: "குடிமக்கள் டாஷ்போர்டு",
      menu: "பட்டியல்",
      closeMenu: "பட்டியலை மூடவும்",
      maintenanceIntelligence: "பராமரிப்பு நுண்ணறிவு",
      workOrders: "பணி ஆணைகள்",
      civicIntelligence: "குடிமை நுண்ணறிவு",
    },
    hero: {
      title: "உங்கள் நகரத்தை சிறப்பாக மாற்றுங்கள்",
      subtitle:
        "நகர சிக்கல்களை புகாரளிக்கவும், முன்னேற்றத்தை கண்காணிக்கவும், உங்கள் சமூகத்தின் புகார்கள் எவ்வாறு தீர்க்கப்படுகின்றன என்பதை பாருங்கள்.",
      cta1: "புகாரளிக்கவும்",
      cta2: "புகாரைக் கண்காணிக்கவும்",
      note: "அநாமதேய முறையில் புகாரளிக்கலாம். கணக்கு தேவையில்லை.",
      badgeComplaints: "புகார்கள் கண்காணிக்கப்பட்டன",
      badgeCompliance: "SLA இணக்கம்",
    },
    quickActions: {
      report: {
        title: "புகாரளிக்கவும்",
        desc: "AI உதவியுடன் புதிய நகர புகாரை சமர்ப்பிக்கவும்",
        action: "இப்போது புகாரளிக்கவும்",
      },
      track: {
        title: "புகாரைக் கண்காணிக்கவும்",
        desc: "புகார் ID மற்றும் PIN மூலம் நிலையை சரிபார்க்கவும்",
        action: "இப்போது கண்காணிக்கவும்",
      },
      map: {
        title: "நகர வரைபடம்",
        desc: "உங்கள் பகுதியில் நேரடி நகர சிக்கல்களை பாருங்கள்",
        action: "வரைபடம் பாருங்கள்",
      },
      chat: {
        title: "CivicAI கேளுங்கள்",
        desc: "தமிழ் அல்லது ஆங்கிலத்தில் AI உதவி பெறுங்கள்",
        action: "உரையாடல் தொடங்கவும்",
      },
      transparency: {
        title: "வெளிப்படைத்தன்மை மையம்",
        desc: "நகர அளவிலான தீர்வு அளவீடுகள் மற்றும் SLA களைப் பாருங்கள்",
        action: "பகுப்பாய்வு பாருங்கள்",
      },
    },
    services: {
      heading: "நகர சேவைகள்",
      road: {
        name: "சாலைகள் மற்றும் நடைபாதைகள்",
        desc: "சாலை குழிகள், சேதமடைந்த சாலைகள் மற்றும் நடைபாதை பிரச்சினைகளைப் புகாரளிக்கவும்.",
      },
      garbage: {
        name: "குப்பை மற்றும் சுகாதாரம்",
        desc: "குப்பை நிறைவு, சட்டவிரோத கொட்டல், சேகரிப்பு தவறுகை.",
      },
      streetlight: {
        name: "தெரு விளக்குகள்",
        desc: "உடைந்த, காணாமல் போன அல்லது மின்னும் விளக்குகள்.",
      },
      water: {
        name: "குடிநீர் விநியோகம்",
        desc: "கசிவு, விநியோக தடை, குறைந்த அழுத்தம்.",
      },
      drainage: {
        name: "வடிகால் அமைப்பு",
        desc: "தடைபட்ட வடிகால், நீர்தேக்கம், கழிவுநீர் நிரம்புதல்.",
      },
      traffic: {
        name: "போக்குவரத்து மற்றும் நிறுத்தம்",
        desc: "சிக்னல் சிக்கல்கள், சட்டவிரோத நிறுத்தம்.",
      },
      parks: {
        name: "பூங்காக்கள் மற்றும் மரங்கள்",
        desc: "வீழ்ந்த மரங்கள், பூங்கா பராமரிப்பு, பசுமை இடங்கள்.",
      },
      buildings: {
        name: "பொது கட்டிடங்கள்",
        desc: "அரசு கட்டிடங்களின் பராமரிப்பு.",
      },
      animal: {
        name: "தெரு விலங்குகள் & கால்நடைகள்",
        desc: "தெரு மாடுகள், நாய்கள் மற்றும் விலங்கு கட்டுப்பாடு.",
      },
      fire: {
        name: "தீ & பாதுகாப்பு ஆபத்து",
        desc: "தீ அபாயங்கள், மின்சார ஆபத்துகள் மற்றும் பாதுகாப்பு.",
      },
      other: {
        name: "மற்றவை",
        desc: "மேலே பட்டியலிடப்படாத வேறு ஏதேனும் நகர சிக்கல்.",
      },
    },
    home: {
      recentlyResolved: "சமீபத்தில் தீர்க்கப்பட்டவை",
      viewTransparency: "வெளிப்படைத்தன்மை தரவு →",
      platformAccess: "மேடை அணுகல்",
      platformAccessDesc: "வெவ்வேறு பங்காளிகளுக்கு வெவ்வேறு காட்சிகள்",
      departmentRole: {
        title: "துறை டாஷ்போர்டு",
        desc: "புகார்கள் மற்றும் SLA நிர்வகிக்கவும்",
      },
      adminRole: {
        title: "நிர்வாக கட்டுப்பாட்டு மையம்",
        desc: "நகர கண்காணிப்பு மற்றும் பகுப்பாய்வு",
      },
      officerRole: { title: "களப் பணியாளர்", desc: "களப் பணியாளர் மொபைல்" },
    },
    stats: {
      heading: "புள்ளிவிவரங்கள்",
      total: "மொத்த புகார்கள்",
      resolved: "தீர்க்கப்பட்டவை",
      inProgress: "நிலுவையிலுள்ளவை",
      resolutionRate: "தீர்வு விகிதம்",
      avgTime: "சராசரி தீர்வு நேரம்",
      slaCompliance: "SLA இணக்கம்",
      days: "நாட்கள்",
    },
    report: {
      heading: "நகர சிக்கலை புகாரளிக்கவும்",
      steps: [
        "சிக்கல் வகை",
        "விவரம்",
        "இருப்பிடம்",
        "ஆதாரம்",
        "தனியுரிமை",
        "AI மதிப்பாய்வு",
        "இறுதி மதிப்பாய்வு",
      ],
      step1: {
        heading: "என்ன நடந்தது?",
        subheading: "சிக்கலை சிறப்பாக விவரிக்கும் வகையை தேர்வு செய்யவும்",
      },
      step2: {
        heading: "சிக்கலை விவரிக்கவும்",
        subheading: "நம் குழு வேகமாக பதிலளிக்க உதவும் தகவல்களை வழங்கவும்",
        label: "விவரம்",
        placeholder:
          "நீங்கள் பார்ப்பதை விவரிக்கவும், எப்போது தொடங்கியது, அது உங்களை எவ்வாறு பாதிக்கிறது...",
        voice: "குரல் உள்ளீடு",
        photo: "புகைப்படம் இணைக்கவும்",
        video: "வீடியோ இணைக்கவும்",
      },
      step3: {
        heading: "எங்கே உள்ளது?",
        subheading: "சிக்கலை துல்லியமாக அடையாளம் காண உதவுங்கள்",
        useGPS: "தற்போதைய இருப்பிடத்தை பயன்படுத்தவும்",
        selectMap: "வரைபடத்தில் தேர்வு செய்யவும்",
        search: "இருப்பிடம் தேடவும்",
        accuracy: "இருப்பிட துல்லியம்",
        ward: "வார்டு",
        zone: "மண்டலம்",
        detecting: "உங்கள் இருப்பிடம் கண்டறியப்படுகிறது...",
        denied: "இருப்பிட அணுகல் மறுக்கப்பட்டது. கைமுறையாக உள்ளிடவும்.",
        unavailable: "GPS கிடைக்கவில்லை. தேடவும்.",
      },
      step4: {
        heading: "ஆதாரம் சேர்க்கவும்",
        subheading: "புகைப்படங்கள் சிக்கல்களை வேகமாக தீர்க்க உதவுகின்றன",
        upload: "புகைப்படம் / வீடியோ பதிவேற்றவும்",
        formats: "ஏற்றுக்கொள்ளப்படுவன: JPEG, PNG, WEBP, MP4 · அதிகபட்சம் 10MB",
        privacy: "தேவையற்ற தனிப்பட்ட தகவல்களை பதிவேற்ற வேண்டாம்.",
        blur: "முகங்கள் மற்றும் வாகன பலகைகளை தானாக மறையச் செய்யவும்.",
      },
      step5: {
        heading: "எவ்வாறு புகாரளிக்க விரும்புகிறீர்கள்?",
        anonymous: "அநாமதேய முறையில் புகாரளிக்கவும்",
        anonymousDesc:
          "பெயர், தொலைபேசி அல்லது மின்னஞ்சல் தேவையில்லை. புகார் ID மற்றும் கண்காணிப்பு PIN வழங்கப்படும்.",
        withAccount: "கணக்குடன் தொடரவும்",
        withAccountDesc:
          "உள்நுழைக அல்லது கணக்கு உருவாக்கி புகார்களை டாஷ்போர்டில் கண்காணிக்கவும்.",
      },
      step6: {
        heading: "AI பரிந்துரை",
        subheading:
          "நம் AI உங்கள் புகாரை பகுப்பாய்வு செய்துள்ளது. மதிப்பாய்வு செய்து உறுதிப்படுத்தவும்.",
        aiLabel: "AI பகுப்பாய்வு",
        aiDisclaimer: "AI பரிந்துரை — இறுதி முடிவு அல்ல",
        confidence: "நம்பகத்தன்மை",
        category: "பரிந்துரைக்கப்பட்ட வகை",
        severity: "பரிந்துரைக்கப்பட்ட தீவிரம்",
        department: "பரிந்துரைக்கப்பட்ட துறை",
        duplicate: "சாத்தியமான நகல்",
        nearbyReports: "அருகிலுள்ள புகார்கள்",
        confirm: "உறுதிப்படுத்தி தொடரவும்",
        change: "மாற்றவும்",
      },
      step7: {
        heading: "மதிப்பாய்வு செய்து சமர்ப்பிக்கவும்",
        subheading: "சமர்ப்பிக்கும் முன் உங்கள் புகாரை மதிப்பாய்வு செய்யவும்",
        summaryCategory: "வகை",
        summaryDescription: "விவரம்",
        summaryLocation: "இருப்பிடம்",
        summaryWard: "வார்டு",
        summaryEvidence: "ஆதாரம்",
        summaryReportType: "புகார் வகை",
        summaryAnonymous: "அநாமதேய",
        summaryWithAccount: "கணக்குடன்",
        submit: "புகாரை சமர்ப்பிக்கவும்",
        back: "திரும்பவும்",
        warning: "சமர்ப்பிக்கும் போது இந்த பக்கத்தை மூட வேண்டாம்.",
      },
      submitting: "சமர்ப்பிக்கப்படுகிறது...",
      success: "புகார் வெற்றிகரமாக பதிவு செய்யப்பட்டது",
      successDesc: "உங்கள் புகார் பதிவு செய்யப்பட்டு தனிப்பட்ட ID வழங்கப்பட்டது.",
      saveNote:
        "உங்கள் புகார் ID மற்றும் கண்காணிப்பு PIN சேமிக்கவும். இந்த புகாரை கண்காணிக்க அவை தேவை.",
      copyId: "புகார் ID நகலெடுக்கவும்",
      download: "ரசீது பதிவிறக்கவும்",
      trackNow: "புகாரைக் கண்காணிக்கவும்",
    },
    track: {
      heading: "உங்கள் புகாரைக் கண்காணிக்கவும்",
      subheading: "நிலையை சரிபார்க்க புகார் ID மற்றும் PIN உள்ளிடவும்",
      idLabel: "புகார் ID",
      idPlaceholder: "எ.கா. CIV-2026-8X72KQ",
      pinLabel: "கண்காணிப்பு PIN",
      pinPlaceholder: "6 இலக்க PIN",
      cta: "புகாரைக் கண்காணிக்கவும்",
      searching: "தேடுகிறது...",
      samplePrompt: "மாதிரி புகாருடன் முயற்சிக்கவும்:",
      pinHelpNote:
        "புகாரை சமர்ப்பிக்கும்போது PIN வழங்கப்படும். அநாமதேய சமர்ப்பிப்புகளுக்கு தனி PIN கிடைக்கும்.",
      notFound: "புகார் கிடைக்கவில்லை. உங்கள் ID மற்றும் PIN சரிபார்க்கவும்.",
      tooManyAttempts: "அதிகமான முயற்சிகள். 30 நிமிடங்கள் கழித்து மீண்டும் முயற்சிக்கவும்.",
      unavailable: "சேவை தற்காலிகமாக கிடைக்கவில்லை. மீண்டும் முயற்சிக்கவும்.",
    },
    complaint: {
      id: "புகார் ID",
      category: "வகை",
      status: "நிலை",
      priority: "முன்னுரிமை",
      department: "துறை",
      officer: "களப் பணியாளர்",
      location: "இருப்பிடம்",
      ward: "வார்டு",
      zone: "மண்டலம்",
      submitted: "சமர்ப்பிக்கப்பட்டது",
      updated: "கடைசியாக புதுப்பிக்கப்பட்டது",
      sla: "SLA",
      slaRemaining: "SLA மீதமுள்ளது",
      slaBreached: "SLA மீறப்பட்டது",
      slaHours: "மணி SLA",
      timeline: "நிலை காலவரிசை",
      reopen: "புகாரை மீண்டும் திறக்கவும்",
      feedback: "கருத்து தெரிவிக்கவும்",
      detailsHeading: "புகார் விவரங்கள்",
      notAssigned: "இன்னும் நியமிக்கப்படவில்லை",
      aiRecommendation: "AI பரிந்துரை",
      aiRoutingDisclaimer:
        "AI வழிநடத்துதலுக்கு மட்டும் உதவுகிறது. மனிதர்களே பொறுப்பாவார்கள்.",
    },
    feedback: {
      wasResolved: "உங்கள் சிக்கல் தீர்க்கப்பட்டதா?",
      yesResolved: "✓ ஆம், தீர்க்கப்பட்டது",
      notResolved: "✗ தீர்க்கப்படவில்லை",
      rateExperience: "உங்கள் அனுபவத்தை மதிப்பிடவும்:",
      tellUsMore: "என்ன நடந்தது என்று கூறுங்கள் (விரும்பினால்)",
      submitFeedback: "கருத்தை சமர்ப்பிக்கவும்",
      thankYou: "உங்கள் கருத்திற்கு நன்றி!",
    },
    status: {
      submitted: "பதிவு செய்யப்பட்டது",
      ai_analysis: "AI பகுப்பாய்வு",
      assigned: "ஒதுக்கப்பட்டது",
      accepted: "பணியாளர் ஏற்றுக்கொண்டார்",
      in_progress: "செயல்பாட்டில் உள்ளது",
      verification: "சரிபார்ப்பு",
      resolved: "தீர்க்கப்பட்டது",
      reopened: "மீண்டும் திறக்கப்பட்டது",
      closed: "மூடப்பட்டது",
    },
    priority: {
      low: "குறைந்த",
      medium: "நடுத்தர",
      high: "அதிக",
      critical: "மிக முக்கியமான",
    },
    map: {
      heading: "நகர சிக்கல் வரைபடம்",
      subheading: "நகரம் முழுவதும் புகாரளிக்கப்பட்ட சிக்கல்களின் நேரடி காட்சி",
      layers: "அடுக்குகள்",
      all: "அனைத்தும்",
      filters: "வடிப்பான்கள்",
      date: "தேதி வரம்பு",
      severity: "தீவிரம்",
      mapView: "வரைபட காட்சி",
      listView: "பட்டியல் காட்சி",
      legend: "விளக்கம்",
      low: "குறைந்த அடர்த்தி",
      moderate: "நடுத்தர",
      high: "அதிக அடர்த்தி",
      mediumHigh: "நடுத்தர / அதிக",
      critical: "மிக முக்கியமான",
      noIssues: "இந்த பகுதியில் நகர சிக்கல்கள் எதுவும் இல்லை.",
      issuesShown: "சிக்கல்கள் காட்டப்படுகின்றன",
      complaintsFound: "புகார்கள் கண்டறியப்பட்டன",
      viewDetails: "விவரங்கள் பாருங்கள் →",
      layerNames: {
        all: "அனைத்தும்",
        road: "சாலைகள்",
        garbage: "குப்பை",
        water: "குடிநீர்",
        drainage: "வடிகால்",
        streetlight: "விளக்குகள்",
        traffic: "போக்குவரத்து",
      },
    },
    transparency: {
      heading: "நம் நகரம் எப்படி பதிலளிக்கிறது?",
      subheading: "பொது வெளிப்படைத்தன்மை தரவு — தினசரி புதுப்பிக்கப்படுகிறது",
      total: "மொத்த புகார்கள்",
      resolved: "தீர்க்கப்பட்டவை",
      inProgress: "நிலுவையிலுள்ளவை",
      resolutionRate: "தீர்வு விகிதம்",
      avgTime: "சராசரி தீர்வு",
      slaCompliance: "SLA இணக்கம்",
      trends: "புகார் போக்குகள்",
      byCategory: "வகை வாரியாக",
      byDepartment: "துறை செயல்திறன்",
      byWard: "வார்டு வரைபடம்",
      reportedSeries: "புகாரளிக்கப்பட்டவை",
      resolvedSeries: "தீர்க்கப்பட்டவை",
      complaintsSeries: "புகார்கள்",
      tableHeaders: {
        department: "துறை",
        total: "மொத்தம்",
        resolved: "தீர்க்கப்பட்டவை",
        sla: "SLA %",
        avgHours: "சராசரி (மணி)",
      },
      anonymizedNote:
        "தரவு அநாமதேயமாக்கப்பட்டுள்ளது, தனிப்பட்ட குடிமக்கள் தகவல் இல்லை. தினசரி புதுப்பிக்கப்படுகிறது.",
    },
    dashboard: {
      greeting: "வணக்கம்",
      subtitle: "உங்கள் நகர புகார்களின் சுருக்கம்.",
      myComplaints: "என் புகார்கள்",
      active: "செயல்பாட்டில்",
      resolved: "தீர்க்கப்பட்டவை",
      reopened: "மீண்டும் திறக்கப்பட்டவை",
      all: "அனைத்தும்",
      noComplaints: "நீங்கள் இதுவரை எந்தப் புகாரும் பதிவு செய்யவில்லை.",
      noComplaintsCta: "புகாரளிக்கவும்",
      reportNewIssue: "புதிய புகாரளிக்கவும்",
    },
    departmentDashboard: {
      title: "துறை டாஷ்போர்டு",
      open: "திறந்தது",
      inProgress: "நடைமுறையில்",
      slaBreached: "SLA மீறல்",
      slaCompliance: "SLA இணக்கம்",
      avgResolution: "சராசரி தீர்வு",
      tableHeaders: {
        complaintId: "புகார் ID",
        category: "வகை",
        ward: "வார்டு",
        priority: "முன்னுரிமை",
        officer: "பணியாளர்",
        sla: "SLA",
        status: "நிலை",
      },
      noMatch: "தேர்ந்தெடுக்கப்பட்ட வடிப்பானுக்கு பொருந்தும் புகார்கள் இல்லை.",
    },
    admin: {
      title: "CivicAI கட்டுப்பாட்டு மையம்",
      liveOperations: "நேரடி நடவடிக்கைகள்",
      overview: "கண்ணோட்டம்",
      total: "மொத்தம்",
      open: "திறந்தது",
      inProgress: "நடைமுறையில்",
      resolved: "தீர்க்கப்பட்டது",
      slaBreached: "SLA மீறல்",
      critical: "மிக முக்கியமான",
      liveAlerts: "நேரடி எச்சரிக்கைகள்",
      departmentPerf: "துறை செயல்திறன்",
      slaPerf: "SLA செயல்திறன்",
      issueTrends: "சிக்கல் போக்குகள்",
      aiQueue: "AI சரிபார்ப்பு வரிசை",
      aiQueueDesc: "இந்த புகார்கள் செயலாக்கத்திற்கு முன் மனித மதிப்பாய்வு தேவை.",
      aiRecommendationBadge: "AI பரிந்துரை",
      aiConfidenceLabel: "AI நம்பகத்தன்மை",
      approve: "அனுமதிக்கவும்",
      change: "மாற்றவும்",
      escalate: "அதிகரிக்கவும்",
      tableHeaders: {
        department: "துறை",
        total: "மொத்தம்",
        open: "திறந்தது",
        inProgress: "நடைமுறையில்",
        resolved: "தீர்க்கப்பட்டது",
        sla: "SLA %",
        breached: "மீறல்",
      },
    },
    officer: {
      title: "களப் பணியாளர்",
      assigned: "ஒதுக்கப்பட்டது",
      urgent: "அவசரமானது",
      dueSoon: "விரைவில் நிறைவடைய வேண்டியது",
      completedToday: "இன்று முடிக்கப்பட்டவை",
      accept: "ஏற்றுக்கொள்",
      navigate: "வழிகாட்டவும்",
      startWork: "பணியை தொடங்கவும்",
      beforePhoto: "முன் புகைப்படம்",
      afterPhoto: "பின் புகைப்படம்",
      submitResolution: "தீர்வை சமர்ப்பிக்கவும்",
      aiVerified: "AI சரிபார்ப்பு: தீர்க்கப்பட்டதாக தெரிகிறது",
      aiReview: "கூடுதல் மதிப்பாய்வு தேவை",
      online: "ஆன்லைன்",
      offline: "ஆஃப்லைன்",
      backToList: "பட்டியலுக்கு திரும்பவும்",
      photoCaptured: "புகைப்படம் எடுக்கப்பட்டது",
      afterPhotoCaptured: "பின் புகைப்படம் எடுக்கப்பட்டது",
      workCompleteAddPhoto: "பணி முடிந்தது — பின் புகைப்படம் சேர்க்கவும்",
      aiVerifying: "AI தீர்வை சரிபார்க்கிறது...",
      aiRecommendationDisclaimer:
        "AI முடிவு பரிந்துரை மட்டுமே. மேற்பார்வையாளர் மதிப்பாய்வு செய்யலாம்.",
      markResolved: "தீர்க்கப்பட்டதாக குறிக்கவும்",
      complaintResolved: "புகார் தீர்க்கப்பட்டது!",
      backToAssignments: "ஒதுக்கீடுகளுக்கு திரும்பவும்",
      myAssignments: "என் ஒதுக்கீடுகள்",
      steps: {
        assigned: "ஒதுக்கப்பட்டது",
        accepted: "ஏற்றுக்கொண்டது",
        beforePhoto: "முன் புகைப்படம்",
        working: "பணியிலிருக்கிறது",
        afterPhoto: "பின் புகைப்படம்",
        aiVerify: "AI சரிபார்ப்பு",
        resolved: "தீர்க்கப்பட்டது",
      },
    },
    chat: {
      greeting: "வணக்கம்! CivicAI உங்களுக்கு எப்படி உதவ வேண்டும்?",
      placeholder: "ஒரு செய்தி அல்லது கேள்வி தட்டச்சு செய்யவும்...",
      suggested: "பரிந்துரைக்கப்பட்ட கேள்விகள்",
      prompts: [
        "குழி புகாரளிக்கவும்",
        "என் புகாரை கண்காணிக்கவும்",
        "குப்பையை எவ்வாறு புகாரளிப்பது?",
        "என் புகார் நிலை என்ன?",
      ],
      typing: "CivicAI தட்டச்சு செய்கிறது...",
      openAssistant: "AI உதவியாளரைத் திறக்கவும்",
      closeChat: "உரையாடலை மூடவும்",
      sendMessage: "செய்தி அனுப்பவும்",
      online: "ஆன்லைன்",
      disclaimer: "AI தவறு செய்யலாம். அவசர சிக்கல்களுக்கு உதவி எண்ணை அழைக்கவும்.",
    },
    accessibility: {
      title: "அணுகலுரிமை",
      increaseText: "எழுத்து பெரிதாக்கவும்",
      decreaseText: "எழுத்து சிறிதாக்கவும்",
      highContrast: "அதிக வேறுபாடு",
      highlightLinks: "இணைப்புகளை முன்னிலைப்படுத்தவும்",
      lineSpacing: "வரி இடைவெளி",
      reduceMotion: "இயக்கம் குறைக்கவும்",
      textToSpeech: "உரை-இல்-இருந்து-பேச்சு",
      reset: "மீட்டமைக்கவும்",
      closeToolbar: "அணுகலுரிமைப் பட்டையை மூடவும்",
    },
    errors: {
      network: "சேவையுடன் இணைக்க முடியவில்லை. உங்கள் இணைப்பை சரிபார்க்கவும்.",
      server: "ஏதோ தவறு ஏற்பட்டுள்ளது. மீண்டும் முயற்சிக்கவும்.",
      timeout: "கோரிக்கை நேரம் முடிந்தது. மீண்டும் முயற்சிக்கவும்.",
      offline:
        "நீங்கள் தற்போது இணையத்துடன் இணைக்கப்படவில்லை. சில செயல்பாடுகள் கிடைக்காமல் போகலாம்.",
      session: "உங்கள் அமர்வு காலாவதியாகிவிட்டது. மீண்டும் உள்நுழைக.",
      forbidden: "இதை பார்க்க உங்களுக்கு அனுமதி இல்லை.",
      rateLimit: "அதிக கோரிக்கைகள். கொஞ்சம் காத்திருக்கவும்.",
      fileTooLarge: "கோப்பு மிகவும் பெரியது. அதிகபட்சம் 10MB.",
      invalidFile: "தவறான கோப்பு வகை. JPEG, PNG, WEBP அல்லது MP4 பதிவேற்றவும்.",
      retry: "பாதுகாப்பாக மீண்டும் முயற்சிக்கவும்",
      duplicate:
        "அருகில் ஒத்த புகார் ஏற்கனவே இருக்கலாம். சமர்ப்பிக்கும் முன் மதிப்பாய்வு செய்யவும்.",
    },
    footer: {
      tagline: "AI-இயங்கும் நகர சிக்கல் புகார் மேடை",
      platformHeading: "மேடை",
      servicesHeading: "சேவைகள்",
      legalHeading: "சட்டம் & விதிமுறைகள்",
      about: "பற்றி",
      services: "சேவைகள்",
      departments: "துறைகள்",
      transparency: "வெளிப்படைத்தன்மை",
      reportIssue: "புகாரளிக்கவும்",
      trackComplaint: "புகாரைக் கண்காணிக்கவும்",
      civicMap: "நகர வரைபடம்",
      aiAssistant: "AI உதவியாளர்",
      help: "உதவி மற்றும் ஆதரவு",
      accessibility: "அணுகலுரிமை",
      privacy: "தனியுரிமை கொள்கை",
      terms: "பயன்பாட்டு விதிமுறைகள்",
      security: "பாதுகாப்பு",
      contact: "தொடர்பு",
      sitemap: "தள வரைபடம்",
      helpline: "அதிகாரப்பூர்வ நகர உதவி எண்",
      helplineNote: "சரிபார்ப்பிற்கு பிறகு தொடர்பு தகவல் வெளியிடப்படும்.",
      copyright: "© 2026 CivicAI. தமிழ்நாடு நகர்புறச் சேவைகள்.",
      disclaimer:
        "இது குடிமக்கள் சேவை மேடை. அனைத்து புகார்களும் அங்கீகரிக்கப்பட்ட அரசு துறைகளால் கையாளப்படுகின்றன.",
    },
    camera: {
      title: "சாதன கேமரா",
      initializing: "கேமரா தொடங்குகிறது...",
      capture: "படம் எடுக்கவும்",
      retake: "மீண்டும் எடுக்க",
      usePhoto: "இப்படத்தைப் பயன்படுத்த",
      photoCaptured: "படம் எடுக்கப்பட்டது",
      flipCamera: "கேமராவை மாற்றுக",
      deniedTitle: "கேமரா அனுமதி மறுக்கப்பட்டது",
      deniedDesc:
        "உலாவி அமைப்புகளில் கேமரா அனுமதி மறுக்கப்பட்டுள்ளது. சாதனத்திலிருந்து புகைப்படத்தை பதிவேற்றலாம்.",
      unavailableTitle: "கேமரா கிடைக்கவில்லை",
      unavailableDesc: "இந்த சாதனத்தில் கேமரா கண்டறியப்படவில்லை. புகைப்படத்தை பதிவேற்றலாம்.",
      unsupportedDesc: "உங்கள் உலாவி நேரலை கேமராவை ஆதரிக்கவில்லை. கோப்பைப் பதிவேற்றவும்.",
      fallbackUpload: "புகைப்படத்தை பதிவேற்றவும்",
    },
    uploader: {
      selectPhotoPrompt:
        "குடிமைப் பிரச்சினையின் புகைப்படத்தைப் பதிவேற்றவும் அல்லது எடுக்கவும்",
      aiAnalyzeNote:
        "உங்கள் புகைப்படம் CivicAI மூலம் பகுப்பாய்வு செய்யப்பட்டு வகை, தீவிரம் மற்றும் துறை பரிந்துரைக்கப்படும்.",
      uploadImage: "புகைப்படம் பதிவேற்றுக",
      captureImage: "புகைப்படம் எடுக்கவும்",
      supportedFormats: "ஆதரிக்கப்படுபவை: JPG, PNG, WEBP (அதிகபட்சம் 10MB)",
      imageReady: "புகைப்படம் பகுப்பாய்வுக்கு தயார்",
      replaceImage: "படத்தை மாற்றுக",
      removeImage: "படத்தை நீக்குக",
      analyzePromptTitle: "AI பார்வை பகுப்பாய்வுக்கு தயார்",
      analyzePromptDesc:
        "வகை மற்றும் தீவிரத்தை தானாகக் கண்டறிய CivicAI மூலம் பகுப்பாய்வு செய்யவும்",
      analyzeWithCivicAI: "CivicAI மூலம் பகுப்பாய்வு செய்",
      analyzing: "பகுப்பாய்வு செய்கிறது...",
      invalidFormatError:
        "செல்லுபடியாகும் புகைப்பட கோப்பை (JPEG, PNG, அல்லது WEBP) பதிவேற்றவும்.",
      fileTooLargeError: "புகைப்படத்தின் அளவு அதிகம். அதிகபட்ச அளவு 10MB.",
      imageTooSmallError: "துல்லியமான பகுப்பாய்வுக்கு படத்தின் தரம் போதாது.",
    },
    aiCard: {
      aiRecommendationBadge: "AI பரிந்துரை",
      aiDisclaimerNote: "பயனர் & நிர்வாக சரிபார்ப்புக்கு உட்பட்டது",
      confidence: "நம்பகத்தன்மை",
      detectedIssueLabel: "கண்டறியப்பட்ட பிரச்சினை",
      severityLabel: "மதிப்பிடப்பட்ட தீவிரம்",
      suggestedDepartmentLabel: "AI பரிந்துரைத்த துறை",
      routingConfidence: "துறை நம்பகத்தன்மை",
      isThisCorrectPrompt: "இந்த AI வகைப்பாடு சரியானதா?",
      categoryLabel: "பிரச்சினை வகை",
      yesContinue: "ஆம், தொடரவும்",
      changeCategory: "வகையை மாற்றுக",
      keepRecommendation: "பரிந்துரையை தக்கவைக்க",
      selectCorrectCategory: "சரியான வகையை கீழே தேர்ந்தெடுக்கவும்:",
      lowConfidenceBadge: "குறைந்த AI நம்பகத்தன்மை",
      lowConfidenceHeading: "AI-ஆல் பிரச்சினையை உறுதியாக அடையாளம் காண முடியவில்லை",
      lowConfidenceDesc:
        "நம்பகத்தன்மை குறைவாக உள்ளது. சரியான துறைக்கு அனுப்ப கீழே உள்ள வகைகளில் ஒன்றை தேர்ந்தெடுக்கவும்.",
      tryAnotherImage: "வேறு படத்தை முயற்சிக்கவும்",
      continueWithDescription: "விவரத்துடன் தொடரவும்",
      validatingImage: "படத்தை சரிபார்க்கிறது...",
      uploadingImage: "படத்தை மேம்படுத்துகிறது...",
      analyzingWithGemini: "CivicAI மூலம் பகுப்பாய்வு செய்கிறது...",
      processingDesc:
        "குடிமைச் சேதம், தீவிரம் மற்றும் துறை விதிகளை பகுப்பாய்வு செய்கிறது.",
      timeoutTitle: "பகுப்பாய்வு நேரம் கடந்துவிட்டது",
      rateLimitedTitle: "கோரிக்கை வரம்பு எட்டப்பட்டது",
      errorTitle: "பகுப்பாய்வு கிடைக்கவில்லை",
      genericError:
        "CivicAI பகுப்பாய்வை முடிக்க முடியவில்லை. வகையை நீங்களே தேர்வு செய்து தொடரலாம்.",
      selectCategoryManually: "வகையை நேரடியாக தேர்ந்தெடுக்க",
      chooseCategory: "வகையைத் தேர்ந்தெடுக்கவும்",
    },
  },
}
