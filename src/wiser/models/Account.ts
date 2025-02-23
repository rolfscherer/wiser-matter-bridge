export interface Account {
  /**
   * user type like `installer`, `admin` or `enduser`
   */
  user?: string;
  /**
   * source user type where this account was copied from
   */
  source?: string;
  /**
   * [app-only] login name of user
   */
  login?: string;
  /**
   * [app-only] company the user works for
   */
  company?: string;
  /**
   * [app-only] full name of user
   */
  name?: string;
}

export interface AccountClones {
  /**
   * user type cloned from the existing user
   */
  user?: string;
  /**
   * secret cloned from the existing user
   */
  secret?: string;
}
