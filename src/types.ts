export interface PersonaListing {
  slug: string;
  name: string;
  headline: string;
}

export interface PersonaContent {
  slug: string;
  name: string;
  content: string;
  reflections: string[];
}

export interface PersonaProperties {
  Name: {
    title: Array<{
      text: {
        content: string;
      };
    }>;
  };
  Status: {
    status: {
      name: string;
    };
  };
  Slug: {
    rich_text: Array<{
      text: {
        content: string;
      };
    }>;
  };
  Headline: {
    rich_text: Array<{
      text: {
        content: string;
      };
    }>;
  };
}

export interface HistoryProperties {
  Date: {
    title: Array<{
      text: {
        content: string;
      };
    }>;
  };
  "Document Type": {
    select: {
      name: "Persona Update" | "Reflection";
    };
  };
  Content: {
    files: Array<{
      name: string;
      file?: {
        url: string;
      };
      file_upload?: {
        id: string;
      };
    }>;
  };
}