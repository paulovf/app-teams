#!/usr/bin/env node --harmony

let path = require('path');
let chalk = require('chalk');
let _ = require('lodash');
let shell = require('shelljs');
let { TRAVIS, TRAVIS_BRANCH, TRAVIS_PULL_REQUEST, TRAVIS_COMMIT_MESSAGE, AZURE_WA_USERNAME, AZURE_WA_SITE, AZURE_WA_PASSWORD } = process.env;
process.env.NODE_ENV = process.env.ENV = 'production';

precheck();

/* If running inside of a pull request then skip deploy */
if (TRAVIS_PULL_REQUEST !== 'false') {
    exit('Skipping deploy for pull requests');
    return;
}

/* Check if the branch name is valid. */
let slot = _.isString(TRAVIS_BRANCH) && _.kebabCase(TRAVIS_BRANCH);
if (slot == null) {
    exit('Invalid branch name. Skipping deploy.', true);
}

switch (slot) {
    case 'master':
        slot = 'edge';
        break;

    default:
        exit('No deployment configuration found for ' + slot + '. Skipping deploy.');
}

const URL = 'https://' + AZURE_WA_SITE + '.azurewebsites.net';

const DEPLOY_URL = 'https://'
    + AZURE_WA_USERNAME + ':'
    + AZURE_WA_PASSWORD + '@'
    + AZURE_WA_SITE + '.scm.azurewebsites.net:443/'
    + AZURE_WA_SITE + '.git';

log('Deploying commit: "' + TRAVIS_COMMIT_MESSAGE + '" to ' + AZURE_WA_SITE + '-' + slot + '...');

deployBuild(DEPLOY_URL, 'dist');

function precheck(skip) {
    if (skip) {
        return;
    }

    /* Check if the code is running inside of travis.ci. If not abort immediately. */
    if (!TRAVIS) {
        exit('Not running inside of Travis. Skipping deploy.', true);
    }

    /* Check if the username is configured. If not abort immediately. */
    if (!_.isString(AZURE_WA_USERNAME)) {
        exit('"AZURE_WA_USERNAME" is a required global variable.', true);
    }

    /* Check if the password is configured. If not abort immediately. */
    if (!_.isString(AZURE_WA_PASSWORD)) {
        exit('"AZURE_WA_PASSWORD" is a required global variable.', true);
    }

    /* Check if the website name is configured. If not abort immediately. */
    if (!_.isString(AZURE_WA_SITE)) {
        exit('"AZURE_WA_SITE" is a required global variable.', true);
    }
}

function deployBuild(url, folder) {
    try {
        let current_path = path.resolve();
        let next_path = path.resolve(folder);
        shell.cd(next_path);
        const start = Date.now();
        shell.exec('git init');
        shell.exec('git config --add user.name "Travis CI"');
        shell.exec('git config --add user.email "travis.ci@microsoft.com"');
        let result = shell.exec('git add -A');
        if (result.code !== 0) {
            shell.echo(result.stderr);
            exit('An error occurred while adding files...', true);
        }
        result = shell.exec('git commit -m "' + TRAVIS_COMMIT_MESSAGE + '"');
        if (result.code !== 0) {
            shell.echo(result.stderr);
            exit('An error occurred while commiting files...', true);
        }
        log('Pushing ' + folder + ' to ' + URL + '... Please wait...');
        result = shell.exec('git push ' + url + ' -q -f -u HEAD:refs/heads/master', { silent: true });
        if (result.code !== 0) {
            exit('An error occurred while deploying ' + folder + ' to ' + URL + '...', true);
        }
        const end = Date.now();
        log('Successfully deployed in ' + (end - start) / 1000 + ' seconds.', 'green');
        shell.cd(current_path);
    }
    catch (error) {
        log('Deployment failed...', 'red');
        console.log(error);
    }
}

function log(message, color) {
    console.log(chalk.bold[color || 'cyan'](message));
}

function exit(reason, abort) {
    if (reason) {
        abort ? console.log(chalk.bold.red(reason)) : console.log(chalk.bold.yellow(reason));
    }

    return abort ? process.exit(1) : process.exit(0);
}
