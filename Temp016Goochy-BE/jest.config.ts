import { Config } from '@jest/types';

const baseTestDir = '<rootDir>/test/services'; //rootDir is the root of the project

const config: Config.InitialOptions = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: [
        `${baseTestDir}/**/*test.ts` 
    ],
    // specifie the location of test files
    // **/ recursively search for files in subdirectories
    // *test.ts search for files that end with test.ts
}

export default config; //must be eported as default