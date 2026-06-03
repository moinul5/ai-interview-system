-- ============================================================================
-- seed_voice_questions.sql
-- Seed the `questions` table with 30 voice interview questions
-- across 6 categories × 3 difficulties (easy, medium, hard).
-- Run this AFTER importing ai_interview_system.sql or schema_extensions.sql.
-- ============================================================================

-- ── DBMS ────────────────────────────────────────────────────────────────────

INSERT INTO `questions` (`question_text`, `category`, `difficulty`, `expected_answer`) VALUES
('What is a primary key in a database?', 'DBMS', 'easy',
 'A primary key is a unique identifier for each record in a table. It cannot be NULL and must contain unique values. It ensures entity integrity.'),

('What is the difference between DELETE and TRUNCATE?', 'DBMS', 'easy',
 'DELETE removes rows one by one and can have a WHERE clause. TRUNCATE removes all rows at once, is faster, resets auto-increment, and cannot be rolled back in some databases.'),

('Explain the concept of database indexing and its types.', 'DBMS', 'medium',
 'Indexing improves query performance by creating a data structure for faster lookups. Types include B-tree index, hash index, clustered index, and non-clustered index. Trade-off is extra storage and slower writes.'),

('What are ACID properties in database transactions?', 'DBMS', 'medium',
 'ACID stands for Atomicity (all or nothing), Consistency (valid state transitions), Isolation (concurrent transactions don''t interfere), Durability (committed data persists). These ensure reliable transaction processing.'),

('Explain database sharding and when you would use it.', 'DBMS', 'hard',
 'Sharding is horizontal partitioning of data across multiple database instances. Each shard holds a subset of data. Used for massive scale when vertical scaling is insufficient. Challenges include cross-shard queries and rebalancing.');

-- ── Programming ─────────────────────────────────────────────────────────────

INSERT INTO `questions` (`question_text`, `category`, `difficulty`, `expected_answer`) VALUES
('What is the difference between a compiled and an interpreted language?', 'Programming', 'easy',
 'Compiled languages are translated to machine code before execution (C, C++), offering faster runtime. Interpreted languages are executed line by line at runtime (Python, JavaScript), offering more flexibility but slower execution.'),

('Explain what object-oriented programming is.', 'Programming', 'easy',
 'OOP is a paradigm based on objects that contain data and methods. Four pillars: Encapsulation (data hiding), Inheritance (code reuse), Polymorphism (many forms), Abstraction (hiding complexity).'),

('What is the difference between deep copy and shallow copy?', 'Programming', 'medium',
 'Shallow copy creates a new object but references the same nested objects. Deep copy creates a completely independent copy of the object and all nested objects. This matters when dealing with mutable nested data structures.'),

('Explain the concept of closures with an example.', 'Programming', 'medium',
 'A closure is a function that captures and remembers variables from its enclosing scope even after the outer function has returned. Common in JavaScript and Python. Used for data privacy, callbacks, and factory functions.'),

('What is the CAP theorem and how does it apply to distributed systems?', 'Programming', 'hard',
 'CAP theorem states a distributed system can guarantee at most two of: Consistency (all nodes see same data), Availability (every request gets a response), Partition tolerance (system works despite network failures). You must choose trade-offs.');

-- ── Web Development ─────────────────────────────────────────────────────────

INSERT INTO `questions` (`question_text`, `category`, `difficulty`, `expected_answer`) VALUES
('What is the difference between HTTP and HTTPS?', 'Web Development', 'easy',
 'HTTP transfers data in plain text. HTTPS encrypts data using SSL/TLS, providing security against eavesdropping and man-in-the-middle attacks. HTTPS requires an SSL certificate and uses port 443 instead of 80.'),

('What is the DOM in web development?', 'Web Development', 'easy',
 'The Document Object Model is a tree-structured representation of an HTML document. It allows JavaScript to access and manipulate page content, structure, and styles dynamically. Browsers create the DOM when parsing HTML.'),

('Explain the difference between REST and GraphQL APIs.', 'Web Development', 'medium',
 'REST uses multiple endpoints with fixed data structures and HTTP methods. GraphQL uses a single endpoint where clients specify exactly what data they need. GraphQL reduces over-fetching but adds complexity. REST is simpler and more cacheable.'),

('What is CORS and why is it important?', 'Web Development', 'medium',
 'Cross-Origin Resource Sharing is a security mechanism that restricts web pages from making requests to different domains. Browsers enforce same-origin policy. CORS headers allow servers to specify which origins can access their resources.'),

('Explain how WebSockets work and when to use them over HTTP.', 'Web Development', 'hard',
 'WebSockets provide full-duplex persistent connections between client and server. Unlike HTTP request-response, data flows both ways simultaneously. Used for real-time apps like chat, live feeds, gaming. Reduces overhead of repeated HTTP connections.');

-- ── Data Structures ─────────────────────────────────────────────────────────

INSERT INTO `questions` (`question_text`, `category`, `difficulty`, `expected_answer`) VALUES
('What is the difference between an array and a linked list?', 'Data Structures', 'easy',
 'Arrays store elements in contiguous memory with O(1) random access but O(n) insertion/deletion. Linked lists use nodes with pointers, allowing O(1) insertion/deletion but O(n) access. Arrays have fixed size; linked lists are dynamic.'),

('What is a stack and where is it used?', 'Data Structures', 'easy',
 'A stack is a LIFO (Last In, First Out) data structure. Operations: push, pop, peek. Used in function call management, undo operations, expression evaluation, backtracking algorithms, and browser history.'),

('Explain how a hash table works and how collisions are handled.', 'Data Structures', 'medium',
 'A hash table maps keys to values using a hash function that computes an index. Collisions occur when two keys hash to the same index. Handled by chaining (linked lists at each index) or open addressing (probing for next empty slot).'),

('What is a balanced binary search tree and why does it matter?', 'Data Structures', 'medium',
 'A balanced BST maintains height O(log n) by ensuring left and right subtrees differ in height by at most one. Examples: AVL tree, Red-Black tree. Without balancing, BST can degrade to O(n) for operations in worst case.'),

('Explain the Trie data structure and its applications.', 'Data Structures', 'hard',
 'A Trie is a tree-like structure where each node represents a character. Used for efficient prefix-based searching. Applications: autocomplete, spell checkers, IP routing, dictionary implementation. Time complexity O(m) where m is key length.');

-- ── Algorithms ──────────────────────────────────────────────────────────────

INSERT INTO `questions` (`question_text`, `category`, `difficulty`, `expected_answer`) VALUES
('What is the difference between linear search and binary search?', 'Algorithms', 'easy',
 'Linear search checks each element sequentially with O(n) time complexity. Binary search requires sorted data, repeatedly halving the search space with O(log n) complexity. Binary search is much faster for large sorted datasets.'),

('Explain what a sorting algorithm is and name a few.', 'Algorithms', 'easy',
 'Sorting algorithms arrange elements in a specific order. Common ones: Bubble Sort O(n²), Selection Sort O(n²), Merge Sort O(n log n), Quick Sort O(n log n) average, Insertion Sort O(n²). Choice depends on data size and constraints.'),

('Explain the concept of dynamic programming with an example.', 'Algorithms', 'medium',
 'Dynamic programming solves complex problems by breaking them into overlapping subproblems and storing results to avoid redundant computation. Example: Fibonacci — instead of exponential recursion, store computed values. Approaches: top-down memoization, bottom-up tabulation.'),

('What is the difference between BFS and DFS graph traversal?', 'Algorithms', 'medium',
 'BFS explores level by level using a queue, finding shortest path in unweighted graphs. DFS explores as deep as possible using a stack or recursion, useful for cycle detection and topological sorting. BFS uses more memory; DFS can get stuck in deep branches.'),

('Explain Dijkstra''s algorithm and its limitations.', 'Algorithms', 'hard',
 'Dijkstra''s finds shortest paths from a source to all vertices in a weighted graph. Uses a priority queue, greedily selecting the nearest unvisited vertex. Time: O((V+E) log V). Limitation: doesn''t work with negative edge weights — use Bellman-Ford instead.');

-- ── Operating Systems ───────────────────────────────────────────────────────

INSERT INTO `questions` (`question_text`, `category`, `difficulty`, `expected_answer`) VALUES
('What is the difference between a process and a thread?', 'Operating Systems', 'easy',
 'A process is an independent program with its own memory space. A thread is a lightweight unit of execution within a process, sharing the same memory. Threads are faster to create and switch between. Multiple threads can run concurrently within one process.'),

('What is virtual memory and why is it used?', 'Operating Systems', 'easy',
 'Virtual memory extends physical RAM using disk space, giving each process the illusion of a large contiguous address space. Uses paging or segmentation. Allows running programs larger than physical memory and provides process isolation.'),

('Explain the concept of deadlock and its four necessary conditions.', 'Operating Systems', 'medium',
 'Deadlock occurs when processes are blocked forever, each waiting for resources held by others. Four conditions: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait. Prevention involves breaking at least one condition.'),

('What are the different CPU scheduling algorithms?', 'Operating Systems', 'medium',
 'FCFS (First Come First Served), SJF (Shortest Job First), Round Robin (time slices), Priority Scheduling, Multilevel Queue. Each has trade-offs between throughput, turnaround time, waiting time, and response time. Modern OS use multilevel feedback queues.'),

('Explain the concept of memory-mapped I/O and how it differs from port-mapped I/O.', 'Operating Systems', 'hard',
 'Memory-mapped I/O maps device registers into the CPU address space, allowing regular load/store instructions. Port-mapped I/O uses separate address space with special instructions. Memory-mapped is simpler for programming but uses address space. Used in modern architectures.');
