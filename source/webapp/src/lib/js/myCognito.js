/**
 *  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.                        *
 *                                                                                                 *
 *  Licensed under the Amazon Software License (the "License"). You may not use this               *
 *  file except in compliance with the License. A copy of the License is located at                *
 *                                                                                                 *
 *      http://aws.amazon.com/asl/                                                                 *
 *                                                                                                 *
 *  or in the "license" file accompanying this file. This file is distributed on an "AS IS"        *
 *  BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the License       *
 *  for the specific language governing permissions and limitations under the License.             *
 *
 */

/**
 * @author MediaEnt Solutions
 */

/* eslint-disable no-console */
/* eslint-disable no-unused-vars */

/**
 * @class ConfigurationError
 * @description configuration error
 */
class ConfigurationError extends Error {
  constructor(...args) {
    super(...args);
    this.name = this.constructor.name;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConfigurationError);
    }
  }
}

/**
 * @class AWSCredentialError
 * @description fail to get credential
 */
class AWSCredentialError extends Error {
  constructor(...args) {
    super(...args);
    this.name = this.constructor.name;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AWSCredentialError);
    }
  }
}

/**
 * @class CognitoSessionNotFoundError
 * @description no user has signed in error
 */
class CognitoSessionNotFoundError extends Error {
  constructor(...args) {
    super(...args);
    this.name = this.constructor.name;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CognitoSessionNotFoundError);
    }
  }
}

/**
 * @class CognitoSessionExpiredError
 * @description session has been expired
 */
class CognitoSessionExpiredError extends Error {
  constructor(...args) {
    super(...args);
    this.name = this.constructor.name;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CognitoSessionExpiredError);
    }
  }
}

/**
 * @class CognitoAuthenticationError
 * @description authentication fail
 */
class CognitoAuthenticationError extends Error {
  constructor(...args) {
    super(...args);
    this.name = this.constructor.name;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CognitoAuthenticationError);
    }
  }
}

/**
 * @class MyCognito
 * @description wrapper class to amazon-cognito-identity-js
 */
class MyCognito {
  constructor() {
    try {
      /* solution-manifest.js is auto-generated by CloudFormation template */
      /* Global variable is the solution ID */
      const {
        Region,
        Cognito: {
          DomainPrefix,
          UserPoolId,
          ClientId,
          IdentityPoolId,
          RedirectUri,
        },
        ApiEndpoint,
      } = SO0050;

      const {
        CognitoUserPool,
      } = AmazonCognitoIdentity;

      this.$domainPrefix = DomainPrefix;
      this.$userPoolId = UserPoolId;
      this.$clientId = ClientId;
      this.$userPool = new CognitoUserPool({ UserPoolId, ClientId });
      this.$identityPoolId = IdentityPoolId;
      this.$redirectUri = encodeURIComponent(RedirectUri);
      this.$region = Region;
      this.$user = undefined;
      this.$firstSignInMonitorInSec = 1;
      this.$iotApiEndpoint = `${ApiEndpoint}/attach-iot-policy`;
      this.$sessionTimer = undefined;
      AWS.config.region = Region;
    } catch (e) {
      throw e;
    }
  }

  get domainPrefix() {
    return this.$domainPrefix;
  }

  get userPoolId() {
    return this.$userPoolId;
  }

  get clientId() {
    return this.$clientId;
  }

  get userPool() {
    return this.$userPool;
  }

  get identityPoolId() {
    return this.$identityPoolId;
  }

  get redirectUri() {
    return this.$redirectUri;
  }

  get region() {
    return this.$region;
  }

  get user() {
    return this.$user;
  }

  set user(val) {
    this.$user = val;
  }

  get isAnonymousUser() {
    return !(this.userPool.getCurrentUser());
  }

  get iotApiEndpoint() {
    return this.$iotApiEndpoint;
  }

  get firstSignInMonitorInSec() {
    return this.$firstSignInMonitorInSec;
  }

  set firstSignInMonitorInSec(val) {
    this.$firstSignInMonitorInSec = Number.parseInt(val, 10);
  }

  get sessionTimer() {
    return this.$sessionTimer;
  }

  set sessionTimer(val) {
    this.$sessionTimer = val;
  }

  /**
   * @function createInstance
   * @description create a singleton of MyCognito object
   */
  static async createInstance() {
    try {
      return new MyCognito();
    } catch (e) {
      console.error(`Fatal error: ${e.message}`);
      throw e;
    }
  }

  /**
   * @function getUserSession
   * @description wrapper to Cognito getSession to get current user session
   * @param {CognitoUser} user
   */
  async getUserSession(user) {
    const promise = new Promise((resolve, reject) => {
      const currentUser = user || this.user;

      if (!currentUser) {
        reject(new CognitoSessionNotFoundError('no current user'));
        return;
      }

      currentUser.getSession((e, session) => {
        if (e) {
          reject(new CognitoSessionNotFoundError(e));
          return;
        }

        resolve(session);
      });
    });
    return promise;
  }

  /**
   * @function checkStatus
   * @description check if there is current, valid coginto user
   */
  async checkStatus() {
    const user = this.userPool.getCurrentUser();

    this.user = undefined;

    if (!user) {
      throw new CognitoSessionNotFoundError('no current user');
    }

    const session = await this.getUserSession(user);

    if (!session.isValid()) {
      /* force it to sign out */
      user.signOut();

      throw CognitoSessionExpiredError(`session expired for ${user.username}`);
    }

    this.user = user;

    return this.user;
  }

  /* eslint-disable no-unused-vars */
  /* eslint-disable class-methods-use-this */
  /**
   * @function onSuccess
   * @description callback from authentication
   * @param {function} resolve
   * @param {function} reject
   * @param {object} data
   */
  async onSuccess(resolve, reject, data) {
    console.log(`${this.user.username} logged in`);
    resolve({ status: 'completed' });
  }

  /**
   * @function onFailure
   * @description callback from authentication
   * @param {function} resolve
   * @param {function} reject
   * @param {Error} e
   */
  async onFailure(resolve, reject, e) {
    this.user = undefined;
    reject(new CognitoAuthenticationError(e.message));
  }

  /**
   * @function newPasswordRequired
   * @description callback from authentication
   * @param {function} resolve
   * @param {function} reject
   * @param {object} userAttributes
   * @param {object} requiredAttributes
   */
  async newPasswordRequired(resolve, reject, userAttributes, requiredAttributes) {
    resolve({
      status: 'newPasswordRequired',
      userAttributes,
      requiredAttributes,
    });
  }
  /* eslint-enable class-methods-use-this */
  /* eslint-enable no-unused-vars */

  /**
   * @function confirmNewPassword
   * @description handle FORCE_CHANGE_PASSWORD message where user is required
   * to set new password
   * @param {string} Password
   */
  async confirmNewPassword(Password) {
    const promise = new Promise((resolve, reject) =>
      this.user.completeNewPasswordChallenge(Password, {}, {
        onSuccess: this.onSuccess.bind(this, resolve, reject),
        onFailure: this.onFailure.bind(this, resolve, reject),
      }));

    const response = await promise;

    /* start a thread to make sure we attach iot policy to the first time logon cognito user */
    this.monitorFirstSignInTimer();

    return response;
  }

  /**
   * @function authenticate
   * @description authenticate user with Cognito service
   * @param {object} params
   */
  async authenticate(params) {
    const promise = new Promise((resolve, reject) => {
      const missing = [
        'Username',
        'Password',
      ].filter(x => !x);

      if (missing.length) {
        reject(new ConfigurationError('username / password invalid'));
      }

      const {
        Username,
        Password,
      } = params;

      const {
        AuthenticationDetails,
        CognitoUser,
      } = AmazonCognitoIdentity;

      const authenticationDetails = new AuthenticationDetails({
        Username,
        Password,
      });

      this.user = new CognitoUser({ Username, Pool: this.userPool });

      /* here we authenticate the user with Cognito */
      this.user.authenticateUser(authenticationDetails, {
        onSuccess: this.onSuccess.bind(this, resolve, reject),
        onFailure: this.onFailure.bind(this, resolve, reject),
        newPasswordRequired: this.newPasswordRequired.bind(this, resolve, reject),
      });
    });

    const response = await promise;

    return response;
  }

  /**
   * @function getCredentials
   * @description get AWS credentials from Cognito IDP
   */
  async getCredentials() {
    const params = {
      IdentityPoolId: this.identityPoolId,
      Logins: {},
    };

    const idToken = this.user.getSignInUserSession().getIdToken();

    const endpoint = `cognito-idp.${this.region}.amazonaws.com/${this.userPoolId}`;

    params.Logins[endpoint] = idToken.getJwtToken();

    const option = {
      region: this.region,
    };

    const {
      CognitoIdentityCredentials,
    } = AWS;

    const credentials = new CognitoIdentityCredentials(params, option);

    try {
      // Here we could attach iot principal using
      // credentials.identityId = "<region>:GUID"
      await credentials.getPromise();

      AWS.config.credentials = credentials;

      this.monitorSession(idToken.getExpiration());

      return credentials;
    } catch (e) {
      throw new AWSCredentialError(e);
    }
  }

  /**
   * @function toStringFromMsecs
   * @description helper function to format millsecs into HH:MM:SS.mmm
   * @param {number} msec
   * @return {string}
   */
  static toStringFromMsecs(msec) {
    /**
     * @function padding
     * @description zero padding to number string based on the 'base'
     * @param {number|float} num - number to convert and pad to string
     * @param {number} base - log10 number
     */
    function padding(num, base = 100) {
      if (num > base) {
        return num.toString();
      }

      const array = num.toString().split('');

      let shift = (Number.parseInt(Math.log10(base), 10)) - array.length;

      while (shift > 0) {
        array.unshift('0');
        shift -= 1;
      }
      return array.join('');
    }

    const HH = Math.floor(msec / 3600000);
    const MM = Math.floor((msec % 3600000) / 60000);
    const SS = Math.floor((msec % 60000) / 1000);
    const mmm = Math.ceil(msec % 1000);

    return `${padding(HH)}:${padding(MM)}:${padding(SS)}.${padding(mmm, 1000)}`;
  }

  /**
   * @function attachIotPolicy
   * @description call APIGW endpoint to attach iot policy to the cognito user
   * @param {string} endpoint - APIGW endpoint
   */
  static async attachIotPolicy(endpoint) {
    const response = await AppUtils.authHttpRequest('POST', endpoint);
    return response;
  }

  /**
   * @function monitorFirstSignInTimer
   * @description bind Iot policy to the coginto identity Id.
   * Only for the very first time the user signs in.
   */
  monitorFirstSignInTimer() {
    setTimeout(async () => {
      try {
        const {
          accessKeyId,
          secretAccessKey,
        } = AWS.config.credentials;

        if (!accessKeyId || !secretAccessKey) {
          throw new Error('credentials not ready');
        }

        console.log(`binding Iot to ${this.user.username}...`);

        await MyCognito.attachIotPolicy(this.iotApiEndpoint);
      } catch (e) {
        this.firstSignInMonitorInSec *= 2;

        e.message = `${e.message}. Retry in ${this.firstSignInMonitorInSec}s...`;
        console.error(e.message);

        this.monitorFirstSignInTimer();
      }
    }, this.firstSignInMonitorInSec * 1000);
  }

  /**
   * @function signOut
   * @description onSignOut, reset credential.
   */
  signOut() {
    this.user.signOut();
    AWS.config.credentials = undefined;
  }

  /**
   * @function refreshSession
   * @description refresh the session periodically
   */
  async refreshSession() {
    const promise = new Promise(async (resolve, reject) => {
      const session = await this.getUserSession();

      const {
        refreshToken,
      } = session;

      this.user.refreshSession(refreshToken, (e, ssn) => {
        if (e) {
          reject(new CognitoSessionNotFoundError(e));
          return;
        }
        resolve(ssn);
      });
    });

    return promise;
  }

  /**
   * @function monitorSession
   * @description refresh session before the session is expired.
   * @param {number} expiration - in seconds
   */
  monitorSession(expiration) {
    const dateExp = new Date(expiration * 1000);

    const refresh = dateExp - new Date() - (10 * 1000);

    console.log(`schedule to refresh session in ${MyCognito.toStringFromMsecs(refresh)} (${dateExp.toISOString()})`);

    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }

    this.sessionTimer = setTimeout(async () => {
      try {
        await this.refreshSession();

        /* update credential */
        await this.getCredentials();
      } catch (e) {
        const err = new CognitoSessionExpiredError(e);
        console.error(err.message);
      }
    }, refresh);
  }
}
