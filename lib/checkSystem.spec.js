"use strict";

const test = require('tape');
const _ = require('lodash');

const checkSystem = require('./checkSystem');
const MockFile = require('../test/MockFile');

test('checkSystem', (t) => {

    t.test('throws when no package.json is present', (t) => {
        checkSystem('./notarealpackage.json').then((result) => {
            t.equal(result.status, -1);
            t.end();
        });
    });

    t.test('throws when no engines key is present', (t) => {
        let mf = new MockFile('testPackage.json', { foo: 'bar' });

        checkSystem(mf.path).then((result) => {
            t.equal(result.status, -1);

            mf.delete();
            mf = undefined;
            t.end();
        });
    });

    t.test('does not throw when engines key exists', (t) => {
        let mf = new MockFile('testPackage2.json', {
            engines: { node: '5.10.1' }
        });

        checkSystem(mf.path).then((result) => {
            t.equal(result.status, 0);

            mf.delete();
            mf = undefined;
            t.end();
        });
    });

    t.test('fails when the correct versions are not found', (t) => {
        let mf = new MockFile('testPackage3.json', {
            engines: {
                node: '0',
                npm: '0'
            }
        });

        checkSystem(mf.path).then((result) => {
            t.equal(result.message.type, 'error');

            mf.delete();
            mf = undefined;
            t.end();
        });
    });

    t.test('fails if all correct versions are not found', (t) => {
        let mf = new MockFile('testPackage4.json', {
            engines: {
                node: process.version.substring(1), // remove the 'v'
                npm: '0'
            }
        });

        checkSystem(mf.path).then((result) => {
            t.equal(result.message.type, 'error');
            t.assert(_.some(result.packages, ['type', 'success']));

            mf.delete();
            mf = undefined;
            t.end();
        });
    });
});
