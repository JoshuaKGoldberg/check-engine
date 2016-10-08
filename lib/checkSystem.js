'use strict';

let check = function () {

    const path = require("path");
    const colors = require('colors');
    const exec = require('child_process').exec;
    const Promise = require("bluebird");
    const _ = require("lodash");
    const validaterRules = require('./validatorRules');
    const promiseHelpers = require("./promiseHelpers");
    const fs = require('fs');
    let engines;

    // set color theme
    colors.setTheme({
        success: 'green',
        info: 'grey',
        warn: 'yellow',
        error: 'red'
    });

    const packageJsonPath = path.join(process.cwd(), "package.json");
    try {
        fs.accessSync(packageJsonPath);
        engines = require(packageJsonPath).engines;
    } catch (ex) {
        console.log("✘ No package.json found in the current directiry so I can't validate what you need!".error);
        process.exit(-1);
    }

    if (!engines) {
        console.log("✘ No engines found in package.json so I can't validate what you need!".error);
        process.exit(-1);
    }

    const thingsToCheck = Object.getOwnPropertyNames(engines);
    const validatorPromises = thingsToCheck.map(validate); // run the function over all items.

    promiseHelpers.allSettled(validatorPromises)
    .then((inspections) => {
        const environmentIsValid = _.every(inspections,
            (inspection) => inspection.isFulfilled() && inspection.value());

        if (environmentIsValid) {
            console.log(colors.success(colors.bold(colors.underline("Environment looks good!"))));
        } else {
            console.log(colors.error(colors.bold(colors.underline("Environment is invalid!"))));
        }
    });

    function validate(name) {

        // find it in the validators
        const validator = validaterRules[name];

        if (validator === undefined) {
            console.log(colors.warn(colors.bold(name) + " was expected, but no validator found!"));
            return Promise.resolve(false);
        }

        // call the validator and pass in the version we expect
        return execAndCheck(validator, engines[name]).then((results) => {
            if (results.result) {
                console.log(colors.success("✔ " + colors.bold(name) + " was validated with " + engines[name]));
            } else {
                console.log(colors.error("✘ " + colors.bold(name) + " version is not correct! Expected: " +
                    engines[name] + " but was " + results.reason.trim()));
            }

            return Promise.resolve(results.result);
        })
        .catch((error) => {
            console.log(colors.error("✘ Error validating " + colors.bold(name)) + ": " + error.trim());
            return Promise.reject();
        });
    }

    function execAndCheck(validator, expectedVersion) {
        let promise = new Promise((resolve, reject) => {
            exec(validator.versionCheck, (error, stdout, stderr) => {

                if (error) {
                    reject(stderr);
                    return;
                }

                resolve({
                    result: validator.versionValidate(stdout, expectedVersion),
                    reason: stdout
                });
            });
        });

        return promise;
    }
};
module.exports = check;
