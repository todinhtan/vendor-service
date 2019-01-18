# vendor-service
Betty Vendor Service

# Folder structure

```
-- config (structure based on NPM config package)
-- constants (all constants accross the application)
-- models (ORM to DB (mongoose for now))
-- routes (Express routing. Consider to separate controller out of routes when we have more endpoint)
-- test (All integration tests go here)
-- -- factories (borrow the idea for girl_factory in ruby to init default object in test case)
-- utils (Common functions, classes)
```

# Coding convention
Using Eslint for checking JS syntax

```bash
npm run lint
```

### Async - Await

Always use async-await (or try to wrap call back function (in 3rd-party library) in to a promise function). It may be a bit slower but not significant. The code will be cleaner to read.

# Testing
- Using jest with all the built-in tool for testing
- `mongodb-memory-server` for in-mem mongo instance while running integration testing

# Commands

```bash
# Start application
npm start
# Run development mode (auto reload)
npm run dev
# Run test suite
npm test
# Check JS syntax
npm run lint
```
