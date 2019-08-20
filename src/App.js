import Amplify, {Auth} from 'aws-amplify';
import awsconfig from './aws-exports';
import $ from 'jquery';
import JSONFormatter from 'json-formatter-js'

Amplify.configure(awsconfig);

function signOut(){
    clearResult();
    Auth.signOut()
        .then(data => appendJson(data))
        .catch(err => appendJson(err));
}

async function signIn(username, password) {
    clearResult();
    try {
        const user = await Auth.signIn(username, password);
        if (user.challengeName === 'SMS_MFA' ||
            user.challengeName === 'SOFTWARE_TOKEN_MFA') {
            // You need to get the code from the UI inputs
            // and then trigger the following function with a button click
            const code = getCodeFromUserInput();
            // If MFA is enabled, sign-in should be confirmed with the confirmation code
            const loggedUser = await Auth.confirmSignIn(
                user,   // Return object from Auth.signIn()
                code,   // Confirmation code
                mfaType // MFA Type e.g. SMS_MFA, SOFTWARE_TOKEN_MFA
            );
        } else if (user.challengeName === 'NEW_PASSWORD_REQUIRED') {
            const {requiredAttributes} = user.challengeParam; // the array of required attributes, e.g ['email', 'phone_number']
            // You need to get the new password and required attributes from the UI inputs
            // and then trigger the following function with a button click
            // For example, the email and phone_number are required attributes
            const {username, email, phone_number} = getInfoFromUserInput();
            const loggedUser = await Auth.completeNewPassword(
                user,               // the Cognito User Object
                newPassword,       // the new password
                // OPTIONAL, the required attributes
                {
                    email,
                    phone_number,
                }
            );
        } else if (user.challengeName === 'MFA_SETUP') {
            // This happens when the MFA method is TOTP
            // The user needs to setup the TOTP before using it
            // More info please check the Enabling MFA part
            Auth.setupTOTP(user);
        } else {
            // The user directly signs in
            appendJson(user);
        }
    } catch (err) {
        if (err.code === 'UserNotConfirmedException') {
            // The error happens if the user didn't finish the confirmation step when signing up
            // In this case you need to resend the code and confirm the user
            // About how to resend the code and confirm the user, please check the signUp part
        } else if (err.code === 'PasswordResetRequiredException') {
            // The error happens when the password is reset in the Cognito console
            // In this case you need to call forgotPassword to reset the password
            // Please check the Forgot Password part.
        } else if (err.code === 'NotAuthorizedException') {
            // The error happens when the incorrect password is provided
        } else if (err.code === 'UserNotFoundException') {
            // The error happens when the supplied username/email does not exist in the Cognito user pool
        } else {
            console.log(err);
        }
        appendJson(err);
    }
}

function signUp(username, password, email) {
    clearResult();
    Auth.signUp({
        username,
        password,
        attributes: {
            email,          // optional
        },
        validationData: []  //optional
    })
        .then(data => appendJson(data))
        .catch(err => appendJson(err));
}

async function confirm(username, code) {
    // After retrieving the confirmation code from the user
    Auth.confirmSignUp(username, code, {
        // Optional. Force user confirmation irrespective of existing alias. By default set to True.
        forceAliasCreation: true
    }).then(data => appendJson(data))
        .catch(err => appendJson(err));
}

async function resend(username) {
    Auth.resendSignUp(username).then(() => {
        appendJson('code resent successfully');
    }).catch(e => {
        appendJson(e);
    });
}

function getCurrentSession() {
    Auth.currentSession()
        .then(data => appendJson(data))
        .catch(err => appendJson(err));
}

function clearResult() {
    const $result = $('#result');
    $result.empty();
}

function displayJson(json) {
    clearResult();
    appendJson(json);
}

function appendJson(json) {
    console.log(json);
    const $result = $('#result');
    const formatter = new JSONFormatter(json);
    $result.get(0).appendChild(formatter.render());
}

$('#signin').on('click', (e) => {
    signIn($('#username').val(), $('#password').val());
});
$('#signout').on('click', (e) => {
    signOut();
});
$('#signup').on('click', (e) => {
    signUp($('#username0').val(), $('#password0').val(), $('#email0').val());
});
$('#session').on('click', (e) => {
    getCurrentSession();
});
//confirm("taichi", "744435");
//signUp("taichi4","hogehoge", "taichi@asaichi.co.jp");
//resend("taichi+2@asaichi.co.jp");
//getCurrentSession();
