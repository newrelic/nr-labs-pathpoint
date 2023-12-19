export const UI_CONTENT = {
  GLOBAL: {
    BUTTON_LABEL_CREATE_FLOW: 'Create new flow',
    BUTTON_LABEL_EDIT_MODE: 'Edit Mode',
    BUTTON_LABEL_AUDIT_LOG: 'Audit Log',
    BUTTON_LABEL_EXIT_EDIT_MODE: 'Done Editing',
    BUTTON_LABEL_INLINE_MODE: 'Inline',
    BUTTON_LABEL_STACKED_MODE: 'Stacked',
  },
  FLOW: {
    //
  },
  STAGE: {
    //
  },
  LEVEL: {
    //
  },
  STEP: {
    //
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
};
