/**
 * Developer Mode Management
 * Allows the owner (mehraansh023@gmail.com) and users who unlock dev mode via passcode
 * to access premium features like Guest Mode and advanced settings.
 */

export function isDeveloperUser(user: any): boolean {
  if (!user) return false;
  
  // 1. Check if the user is logged in with the developer's email
  if (user.email === "mehraansh023@gmail.com") {
    // Persist developer mode locally
    localStorage.setItem("developer_mode", "true");
    return true;
  }
  
  // 2. Check if developer mode was unlocked locally using the passcode
  if (localStorage.getItem("developer_mode") === "true") {
    return true;
  }
  
  return false;
}

// Passcode to unlock developer features
export const DEV_PASSCODE = "owner123"; // Elegant, simple secret code for the owner
