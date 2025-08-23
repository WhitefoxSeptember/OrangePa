const createAnalyzePagePrompt = (applicationType, pageContext) => {
  return `This is a page from ${applicationType}, analyze it and return purpose of the page, including any components linking to other pages.
  **Be concise and do not include any unnecessary information**.
    # Example
  {
    "page_name": "Login Page",
    "purpose": "This is a login page, it is used to login to the system",
    "components": [
      {
        "name": "Login",
        "type": "BUTTON",
        "purpose": "This is a login button, it is used to login to the system."
      }
    ]
  }
    # Page Content
    ${pageContext}
  `;
};

const createPageFlowPrompt = (applicationType, pagesContents) => {
  return `These are pages from ${applicationType}, create a directed graph for the application, where each node is a page and each edge is a link to another page.
  **Be concise and do not include any unnecessary information**.
    # Example
    {
      "Login Page": ["Home Page"],
      "Home Page": ["Login Page", "About Page"],
      "About Page": ["Login Page"]
    }
    # Pages Content
    ${pagesContents}
  `;
};

module.exports = {
  createAnalyzePagePrompt,
  createPageFlowPrompt
};
