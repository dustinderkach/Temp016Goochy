# Qodo Coding Guidelines

## Purpose

These are the best practices and constraints Qodo should follow when generating or reviewing code in this repo.

## Response

-   Do not modifiy code or content or ask to implement chages, but make it easy for me to find and update the code myself so I can learn why and be aware of what is happening in the code base.
-   Show the current code and the recommended code changes in a way that is easy to compare.
-   Show it in a way that is easy to locate from the current code base, including line numbers, include three lines of existing code not being changed before and after.
-   Show what exactly needs to be changed (all characters)

## Infrastructure and Code Based Goals

## Scalabiliaty

-   Everything should be as scanlable as possible. This includes:
-   The ability to delete or destroy all infrastructure and rebuild with as little configuration effort as possible
-   The ability to easily rename application identifiers to esenstially create a new app that start from the existing code base as a template
-   The ability to scale to different regions of the world, for example things like data should be accessed by a user's request with the least amount of latency possible
-   The applicaiton should be designed to be able to scale horizontally, meaning that it can handle increased load by adding more instances rather than upgrading existing ones.
-   Although the application may need to authenticate users in a common region due to technical limitations

## Performance

-   Every user request should be performant where latency and data payload are minimized.
-   Logging should be minimal and only include essential information to avoid performance overhead.
-   Logging should help identifiy performance bottlenecks, but not overwhelm with excessive data.

## Deployment

-   The application should be able to be deployed in production with minimal downtime.

## Coding Guidelines

-   Use consistent naming conventions for variables, functions, and components.
-   Follow a modular architecture to promote reusability and maintainability.
-   Ensure code is well-documented with clear comments and explanations. Every code change must update old comments and add new ones where necessary.
-   Use version control effectively, with clear commit messages and branching strategies.
-   Avoid hardcoding values; use configuration files or environment variables instead.
-   Ensure that the code is secure, following best practices to prevent vulnerabilities.
-   Use linting tools to maintain code quality and consistency.
-   Ensure that the code is compatible with the latest stable version of TypeScript.

## Code Quality Standards

-   All functions must have JSDoc comments explaining parameters and return values
-   Use TypeScript strict mode with no 'any' types
-   Implement proper error boundaries in React components
-   Use structured logging with appropriate log levels

## Security Guidelines

-   Never expose sensitive configuration in public directories
-   Implement proper input validation on all API endpoints
-   Use environment-specific configuration files
-   Encrypt sensitive data at rest and in transit

## Performance Standards

-   API responses must be under 200ms for 95th percentile
-   Frontend bundle size should not exceed 1MB
-   Implement proper caching strategies
-   Use lazy loading for non-critical components

## Modern Versions

-   The applciation should be built using the latest stable versions of all technologies and frameworks.
-   The applicaiton should be architected to be easily upgradable to future versions of the technologies and frameworks used.

## Constraints

-   Never import external libraries unless approved in `approved-libs.md`.

## Context Verificaiton

-   Once this file has been read and ingested as context, please confirm that this happend in the prompt.
