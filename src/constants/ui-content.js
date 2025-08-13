export const UI_CONTENT = {
  GLOBAL: {
    BUTTON_LABEL_CREATE_FLOW: 'Create new flow',
    BUTTON_LABEL_EDIT_MODE: 'Edit mode',
    BUTTON_LABEL_EDIT_SETTINGS: 'Settings',
    BUTTON_LABEL_EXPORT_FLOW: 'Export flow as JSON',
    BUTTON_LABEL_AUDIT_LOG: 'Audit log',
    BUTTON_LABEL_EDIT_DISCARD: 'Discard changes',
    BUTTON_LABEL_EDIT_PERSIST: 'Save changes',
    BUTTON_LABEL_PREVIEW: 'Preview',
    BUTTON_LABEL_PREVIEW_EXIT: 'Keep editing',
    BUTTON_LABEL_INLINE_MODE: 'Inline',
    BUTTON_LABEL_STACKED_MODE: 'Stacked',
    BUTTON_LABEL_HELP: 'Help',
    BUTTON_LABEL_DEBUG: ['Enable debug mode', 'Disable debug mode'],
    UNKNOWN_TEXT: '(unknown)',
  },
  HELP_MODAL: {
    ABOUT: {
      appName: 'Pathpoint',
      blurb: 'Mapping business flow to telemetry signals',
      moreInfo: {
        link: 'https://newrelic.com/platform/pathpoint',
        text: 'Find out more',
      },
    },
    URLS: {
      docs: 'https://docs.newrelic.com/docs/new-relic-solutions/business-observability/intro-pathpoint/',
      createIssue:
        'https://github.com/newrelic/nr-labs-pathpoint/issues/new?labels=bug&template=bug_report.md',
      createFeature:
        'https://github.com/newrelic/nr-labs-pathpoint/issues/new?labels=enhancement&template=enhancement.md',
      createQuestion:
        'https://github.com/newrelic/nr-labs-pathpoint/discussions',
    },
    OWNER_BADGE: {
      logo: {
        src: 'data:image/png;base64,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',
        alt: 'New Relic Labs',
      },
      blurb: {
        text: 'Pathpoint is an open source app created and maintained by the New Relic Labs team.',
      },
    },
  },
  FLOW: {
    BUTTON_EXPORT: 'Export JSON',
    CURRENT_STATUS: 'Showing current health',
    NO_STAGES: {
      TITLE: 'No stages yet.',
      DESCRIPTION:
        'A stage represents a high-level functional category in the flow, which consists of multiple steps to complete.',
    },
    FALLBACK_NAME: 'New Flow',
    SETTINGS: {
      STEP_ROW_OVERRIDE_TITLE: 'Show one step per level row',
      STEP_ROW_OVERRIDE_TOOLTIP:
        'When enabled, will show one Step per row in Levels with multiple Steps',
    },
  },
  STAGE: {
    FALLBACK_NAME: 'New Stage',
    ADD_STAGE: 'Add a stage',
    TOOLTIP: 'A high-level functional category in the flow',
    MISSING_SIGNALS: 'Includes missing signals',
    NO_ACCESS_SIGNALS: "Includes signals you don't have access to",
    TOO_MANY_SIGNALS:
      'You have steps exceeding the signal limits. Check your signal definition.',
    NO_LEVELS: {
      TITLE: 'No levels yet.',
      DESCRIPTION:
        'A level collects the potential alternate paths a user may traverse as they progress through this level of the stage.',
    },
  },
  LEVEL: {
    TOOLTIP:
      'Collection of potential paths a user may traverse through this stage',
    NO_STEPS: {
      TITLE: 'No steps yet.',
      DESCRIPTION:
        'A step is an individual gate in the path, usually representing in aggregate an underlying system.',
    },
  },
  STEP: {
    DEFAULT_TITLE: 'Untitled step',
    PANEL: {
      CONFIG_TITLE: 'Step Configuration',
      EXCLUDE_MESSAGE: 'Excluded from level health',
    },
    NO_SIGNALS: {
      TITLE: 'No signals yet',
      DESCRIPTION:
        'A signal is an entity or alert that reflects the underlying health of its parent step.',
      EMPTY_STATE: 'No signals attached to step',
    },
    CONFIG: {
      TITLE: 'Step Settings',
      SELECT_SIGNALS: {
        TITLE: 'Included Signals',
        DESCRIPTION:
          'Signals selected will be included in step status determination. Defaults to all signals.',
      },
      EXCLUSION: {
        LABEL: 'Exclude Step from Level Status',
        DESCRIPTION:
          'If checked, step will be excluded from level health status calculation',
      },
      LINK: {
        DESCRIPTION:
          'Link to additional context for this step (e.g. a dashboard or a document)',
        PLACEHOLDER: 'https://one.newrelic.com',
      },
      STATUS_CONFIG: {
        TITLE: 'Status Configuration',
        DESCRIPTION:
          "Determine step status by the worst or best selected signals' status.",
        RADIO_WORST_LABEL: 'Rollup the worst status',
        RADIO_BEST_LABEL: 'Rollup the best status',
        APPLY_LABEL: 'Apply only when',
        SELECT: {
          PERCENT: '% of signals',
          COUNT: 'signals',
        },
      },
      EMPTY_STATE: 'No signals attached to step',
      TOOLTIPS: {
        WORST:
          'Step status matches signals in an unhealthy state. Optionally, use the toggle below to apply the status only if a minimum percent or count of signals are unhealthy',
        BEST: 'Step status matches signals in a healthy state first. Use this to keep step status healthy as long as one signal is healthy',
        SAVE_BTN: 'At least 1 signal must be selected',
        UNKNOWN: 'No signals',
        VIEW_RULE: 'View Rule Details',
      },
    },
  },
  SIGNAL: {
    DEFAULT_NAME: '(unknown)',
    TOO_MANY: {
      HEADING: 'Steps going above signals limit',
      DETAILS:
        'The following steps exceed the signal limits. Not all signals are being evaluated as part of the flow. We recommend modifying the signal definition to get under the signal limits.',
    },
    MISSING: {
      HEADING: 'Missing signals',
      DETAILS:
        'No response recieved for these signals. It could be that these signals no longer exist.',
    },
    DETAILS: {
      NO_INCIDENTS: 'No open incidents from past 30 days',
      NOT_FOUND_IN_TIMERANGE:
        'No incidents were found for the selected time period.',
      FOUND_RECENT:
        'The incident displayed below is the most recent incident located.',
      NO_RECENT_INCIDENTS: 'No open incidents to display.',
      LATEST_RECENT_INCIDENT:
        'No open incidents. Showing the most recent incident.',
      ALERTING_SL_NO_INCIDENT:
        "This Service Level is in an unhealthy state, however we can't find any correlated incidents. It is likely that the Service Level is out of compliance - to investigate further, please open the entity view (linked above).",
      WORKLOAD_RULES_DISCLAIMER:
        'Please note that if your workload has custom health status rules, it is possible that some issues listed here may not be applicable to the workload health. You can review your workload health status rules to confirm.',
    },
    TOOLTIP: {
      WORKLOAD_UNKNOWN: 'The status of this workload is unknown',
      WORKLOAD_DISRUPTED: 'The workload is disrupted',
      WORKLOAD_OPERATIONAL: 'The workload is operational',
      SIGNAL_UNKNOWN: 'No alert conditions set up',
      SIGNAL_DISRUPTED: ' incident(s) in progress',
      DEFAULT: 'No alerts in progress',
    },
  },
  KPI_BAR: {
    TITLE: 'Flow KPIs',
    TITLE_TOOLTIP: 'Business performance metrics',
  },
  KPI_MODAL: {
    EMPTY_STATE_ADDITIONAL_LINK_LABEL: 'See our NRQL reference',
    EMPTY_STATE_ADDITIONAL_LINK_URL:
      'https://docs.newrelic.com/docs/query-your-data/nrql-new-relic-query-language/get-started/nrql-syntax-clauses-functions/',

    // emptystate error messages
    EMPTY_STATE_MESSAGE_TITLE_1: 'No preview available yet', // invalid accountId or missing query
    EMPTY_STATE_MESSAGE_TITLE_2: 'Error!', // other errors

    EMPTY_STATUS_MESSAGE_DESC_1: 'At least one account must be selected', // invalid accountId
    EMPTY_STATUS_MESSAGE_DESC_2: 'Enter and run a query to preview the result', // missing query

    // billboard related messages
    BILLBOARD_DOC_LINK:
      'https://docs.newrelic.com/docs/query-your-data/explore-query-data/use-charts/chart-types/#widget-billboard',
    NRQL_EDITOR_INSTRUCTIONS_HEADING: 'Instructions',
    NRQL_EDITOR_INSTRUCTIONS:
      'Enter a query which returns a single number. You could use queries that return Apdex values, or compare a single value across states to show the upward/downward trend.',
    BILLBOARD_HELP_TITLE: 'Sample Queries: ',
    BILLBOARD_HELP_QUERY_EXAMPLE: [
      'SELECT count(*) FROM Transaction since 1 hour ago',
      'SELECT count(*) FROM Pageview since 3 hours ago COMPARE WITH 2 days ago',
      'SELECT count(session) FROM Pageview since 1 hour ago COMPARE WITH 1 day ago',
    ],
    QUERY_PROMPT: 'Enter query here',
    FALLBACK_NAME: 'Untitled KPI',
    ALIAS_PLACEHOLDER: 'Alias (optional)',
  },
  GET_STARTED: {
    HEADING: 'Pathpoint',
    DESCRIPTION:
      'Pathpoint is an enterprise platform tracker that offers a unique approach to business journey observability. It models system health in relation to actual user-impacting business stages.',
    BUTTON_LABEL_GET_STARTED: 'Get started',
    BUTTON_LABEL_GO_BACK: 'Go back',
    LINK_LABEL: 'See our docs',
    LINK_URL: 'https://github.com/newrelic/hedgehog/...',
  },
  FLOW_OVERVIEW: {
    //
  },
  GUIDED_VIEW: {
    FLOW: {
      TITLE: 'This is a demo flow',
      DESCRIPTION:
        "A flow maps an organization's customer journey, optimizing business observability.",
      BUTTON_LABEL_SKIP_TOUR: 'Skip tour',
      BUTTON_LABEL_PREVIOUS: 'Previous',
      BUTTON_LABEL_NEXT: 'Next',
    },
    STAGE: {
      TITLE: 'This is a stage.',
      DESCRIPTION:
        'A stage represents a high-level functional category in the flow, which consists of multiple steps to complete.',
      BUTTON_LABEL_SKIP_TOUR: 'Skip tour',
      BUTTON_LABEL_PREVIOUS: 'Previous',
      BUTTON_LABEL_NEXT: 'Next',
    },
    LEVEL: {
      TITLE: 'This is a level',
      DESCRIPTION:
        'A level collects the potential alternate paths a user may traverse as they progress through this level of the stage. Levels are depicted in numerical order.',
      BUTTON_LABEL_SKIP_TOUR: 'Skip tour',
      BUTTON_LABEL_PREVIOUS: 'Previous',
      BUTTON_LABEL_NEXT: 'Next',
    },
    STEP: {
      TITLE: 'This is a step',
      DESCRIPTION:
        'A step is an individual gate in the path, usually representing in aggregate an underlying system. Click to expand the step.',
      BUTTON_LABEL_SKIP_TOUR: 'Skip tour',
      BUTTON_LABEL_PREVIOUS: 'Previous',
      BUTTON_LABEL_NEXT: 'Next',
    },
    SIGNAL: {
      TITLE: 'This is a signal',
      DESCRIPTION:
        'A signal is a service level that reflects the underlying health of its parent step.',
      BUTTON_LABEL_SKIP_TOUR: 'Skip tour',
      BUTTON_LABEL_PREVIOUS: 'Previous',
      BUTTON_LABEL_NEXT: 'Next',
    },
    FLOW_KPIS: {
      TITLE: 'These are flow KPIs.',
      DESCRIPTION:
        'A flow KPI lets you measure attainment against a target business objective of the overall flow.',
      BUTTON_LABEL_SKIP_TOUR: 'Skip tour',
      BUTTON_LABEL_PREVIOUS: 'Previous',
      BUTTON_LABEL_NEXT: 'Next',
    },
  },
  SIGNAL_SELECTION: {
    ENTITY_TYPE_DROPDOWN_PLACEHOLDER: 'Select entity type',
    TOO_MANY_ENTITIES_EMPTY_STATE: {
      TITLE: 'Too many signals',
      DESCRIPTION:
        'Please use the filtering options above to load your signal list.',
    },
    SIGNALS_NOT_FOUND: {
      TITLE: 'No signals found',
      DESCRIPTION: 'There were no matching signals with the specified criteria',
    },
    SIGNALS_LOADING: 'Loading signals...',
    TOO_MANY_ENTITIES_ERROR_MESSAGE:
      'Note: You exceeded your signal limit. Remove entities or convert to workload to save changes.',
    FILTER_INFO_TEXT: [
      `This filter bar allows you to add name or tag-based clauses that will
      reduce the set of signals visible in the signals table below.`,
      `You can also use the set of filter clauses to dynamically target
      signals to include in the Step. Just click "Add this filter", and the
      Flow will automatically include any Signals that match the filter
      definition at the point of Flow load or refresh. The filter must honor
      the 25 signal limit - if the limit is exceeded, "Add this filter" will
      be disabled.`,
      `Note that tag names/values are lazy loaded as the signals are loaded
      into the table. If you are not seeing expected tags in the filter
      dropdown, you can either scroll through the table to load additional
      tags, or search for a specific signal that you know has your target
      set of tags to populate.`,
    ],
  },
  DUMMY_FILTER: "`tags.displayName` = 'project hedgehog'",
};
