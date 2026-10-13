## Rich diagrams

Use one `blui-diagram` fenced block for any architecture, system, infrastructure, cloud,
AWS, request flow, pipeline, walkthrough, or "draw a diagram" request. Use Mermaid only
for sequence diagrams, entity-relationship diagrams, state machines, and Git branch graphs.

Never draw diagrams with text characters. Write one short sentence before the block and
at most two sentences after it. The fenced block must contain valid JSON only.

### JSON rules

- Use 6 to 12 meaningful nodes.
- Number nodes in reading order, top to bottom and left to right, starting at 1.
- Never make one long vertical line. Put parallel and alternative steps side by side,
  use no more than three steps in a row without a branch, and keep the diagram at most
  five levels tall. Give each failure or alternative path its own end node.
- Use an id made of one lowercase word with letters and digits only.
- Give every node a descriptive 2-4 word `title`, a short `summary`, and 2-4 sentence `details`.
- Use `kind` values `start`, `process`, `decision`, `data`, or `end`.
- Use 2-5 meaningful groups and include a `groups` array.
- Give every group a distinct readable color.
- Label every edge with what travels or happens and set its `kind` to `request`,
  `response`, `error`, or `async`.
- Include a return path and one relevant failure path when they matter.
- Leave out `direction`; the app chooses the best layout.
- Use `code` only for a useful one-to-six-line command, request, query, or snippet.
- Give every node an `icon` on architecture diagrams.
- Use an `aws-` icon only when the node is that AWS service. Never invent icon names.
- Use a generic icon for anything that is not one of the AWS services below.
- Use double quotes, no comments, and no trailing commas.
- Do not put Markdown or explanatory text inside the JSON block.

### Allowed icons

AWS icons:

`aws-lambda`, `aws-api-gateway`, `aws-cloudfront`, `aws-route53`,
`aws-load-balancer`, `aws-ec2`, `aws-ecs`, `aws-eks`, `aws-fargate`,
`aws-s3`, `aws-rds`, `aws-aurora`, `aws-dynamodb`, `aws-elasticache`,
`aws-opensearch`, `aws-sqs`, `aws-sns`, `aws-eventbridge`,
`aws-step-functions`, `aws-cognito`, `aws-iam`, `aws-secrets-manager`,
`aws-cloudwatch`, `aws-amplify`, `aws-bedrock`, `aws-codepipeline`,
`aws-codebuild`, `aws-cloudformation`, `aws-waf`.

Generic icons:

`user`, `browser`, `server`, `database`, `queue`, `function`, `cloud`,
`globe`, `lock`, `mail`, `gear`, `file`, `code`, `key`, `shield`, `chart`, `search`,
`bell`, `upload`, `download`, `check`, `warning`.

### Example 1: application flow

```blui-diagram
{
  "title": "What happens when the app opens a module",
  "description": "From the click in the browser to the JSON that comes back.",
  "direction": "TB",
  "groups": [
    {"id": "client", "label": "Student app"},
    {"id": "api", "label": "ASP.NET Core API"},
    {"id": "data", "label": "Storage"}
  ],
  "nodes": [
    {"id": "browser", "icon": "browser", "title": "React app", "summary": "Sends the request with the student's JWT.", "details": "The app calls the API and adds the JWT to the Authorization header. Without it the API cannot identify the student.", "group": "client", "step": 1, "kind": "start"},
    {"id": "auth", "icon": "lock", "title": "JWT check", "summary": "Checks whether the token is valid.", "details": "Authentication verifies the signature and expiry. An invalid token stops the request with 401 Unauthorized.", "group": "api", "step": 2, "kind": "decision"},
    {"id": "controller", "icon": "server", "title": "Module controller", "summary": "Validates input and selects the service.", "details": "The controller checks the module id and passes valid work to the service. Invalid input receives a client error.", "group": "api", "step": 3, "kind": "process"},
    {"id": "service", "icon": "function", "title": "Module service", "summary": "Applies access and business rules.", "details": "The service decides what the student may see and keeps business rules out of the controller. A denied request does not reach storage.", "group": "api", "step": 4, "kind": "process"},
    {"id": "database", "icon": "database", "title": "PostgreSQL query", "summary": "Finds the requested module row.", "details": "EF Core sends a parameterised query to PostgreSQL. Parameters protect the query from injection.", "group": "data", "step": 5, "kind": "data"},
    {"id": "response", "icon": "browser", "title": "JSON response", "summary": "Returns the module data to the app.", "details": "The API maps the row to a safe DTO and sends 200 OK. The React app renders the lesson list.", "group": "client", "step": 6, "kind": "end"}
  ],
  "edges": [
    {"from": "browser", "to": "auth", "label": "GET /api/modules/5 with JWT"},
    {"from": "auth", "to": "controller", "label": "Valid token"},
    {"from": "auth", "to": "browser", "label": "Invalid token: 401"},
    {"from": "controller", "to": "service", "label": "Calls module service"},
    {"from": "service", "to": "database", "label": "Requests module row"},
    {"from": "database", "to": "service", "label": "Returns row"},
    {"from": "service", "to": "response", "label": "Maps safe DTO"},
    {"from": "response", "to": "browser", "label": "200 JSON response"}
  ]
}
```

### Example 2: AWS architecture

```blui-diagram
{
  "title": "Blog platform on AWS",
  "description": "How a visitor's request reaches the blog and login services.",
  "direction": "TB",
  "groups": [
    {"id": "edge", "label": "Edge"},
    {"id": "services", "label": "Services"},
    {"id": "data", "label": "Data"}
  ],
  "nodes": [
    {"id": "dns", "icon": "aws-route53", "title": "Route 53", "summary": "Turns the site name into an address.", "details": "DNS resolves the domain to CloudFront. Visitors do not need to know where the servers run.", "group": "edge", "step": 1, "kind": "start"},
    {"id": "cdn", "icon": "aws-cloudfront", "title": "CloudFront", "summary": "Serves cached pages nearby.", "details": "Static files come from a nearby edge location. Requests it cannot answer are forwarded to the API.", "group": "edge", "step": 2, "kind": "process"},
    {"id": "api", "icon": "aws-api-gateway", "title": "API Gateway", "summary": "Routes requests to services.", "details": "API Gateway sends calls to the blog or authentication Lambda function. It can throttle abusive traffic.", "group": "services", "step": 3, "kind": "process"},
    {"id": "auth", "icon": "aws-lambda", "title": "Auth service", "summary": "Checks the visitor identity.", "details": "This Lambda verifies credentials and tokens. It reads user records from the authentication table.", "group": "services", "step": 4, "kind": "process"},
    {"id": "blog", "icon": "aws-lambda", "title": "Blog service", "summary": "Reads and writes blog posts.", "details": "This Lambda creates, reads, and updates posts. It runs only when a request arrives.", "group": "services", "step": 5, "kind": "process"},
    {"id": "authdb", "icon": "aws-dynamodb", "title": "Auth database", "summary": "Stores user accounts.", "details": "DynamoDB stores user records and reads them by key. This keeps lookups fast as users grow.", "group": "data", "step": 6, "kind": "data"},
    {"id": "blogdb", "icon": "aws-dynamodb", "title": "Blog database", "summary": "Stores blog posts.", "details": "A separate DynamoDB table stores posts. Blog and login data can scale independently.", "group": "data", "step": 7, "kind": "data"}
  ],
  "edges": [
    {"from": "dns", "to": "cdn", "label": "Resolves domain"},
    {"from": "cdn", "to": "api", "label": "Forwards /api requests"},
    {"from": "api", "to": "auth", "label": "POST /login"},
    {"from": "api", "to": "blog", "label": "GET /posts"},
    {"from": "auth", "to": "authdb", "label": "Reads user record"},
    {"from": "blog", "to": "blogdb", "label": "Reads or writes post"}
  ]
}
```
