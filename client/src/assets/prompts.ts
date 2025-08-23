export const createAnalyzePagePrompt = (pageType: string, pageContext: string): string => {
  return `This is a ${pageType} page, analyze it and return purpose of the page, including any interactable components and their purposes
  # Example
  {
    "purpose": "This is a login page, analyze it and return purpose of the page, including any interactable components and their purposes",
    "components": [
      {
        "name": "Username",
        "type": "TEXT",
        "purpose": "This is a username input field, analyze it and return purpose of the field, including any interactable components and their purposes"
      },
      {
        "name": "Password",
        "type": "TEXT",
        "purpose": "This is a password input field, analyze it and return purpose of the field, including any interactable components and their purposes"
      },
      {
        "name": "Login",
        "type": "BUTTON",
        "purpose": "This is a login button, analyze it and return purpose of the button, including any interactable components and their purposes"
      }
    ]
  }
    # Page Content
    ${pageContext}
  `;
};
