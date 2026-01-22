export const welcomeEmail = (name: string, orgName: string) => {
    return `
    <h2>Welcome to ${orgName} 🎉</h2>
    <p>Hi ${name},</p>
    <p>Your admin account has been created successfully.</p>
    <p>You can now login and start using the CRM.</p>
    <br />
    <p>– FlowCRM Team</p>
  `;
};