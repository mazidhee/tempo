# Systems, Data, ML & Financial Markets Engineering Roadmap

> **Primary direction:** become a strong engineer who can build data-intensive systems, understand machine learning deeply, and apply both to financial markets.
> 
> **Primary systems language:** **C++**. C is a short bridge for memory and systems fundamentals. Rust is retained as an optional later specialization.
> 
> **How to use this roadmap:** follow the **Core Path** roughly in order, but keep building finance/data projects in parallel. Do **not** wait until you have completed the entire roadmap before building. The optional branches are not prerequisites.

### Priority labels

- **CORE** — on the critical path for your direction.
- **APPLICATION** — use finance/markets to reinforce engineering and ML.
- **LATER** — important, but only after the core is solid.
- **OPTIONAL SPECIALIZATION** — pursue if your interests converge there; not required to progress.

---

## 1. Foundations of Computation — CORE

### How Computers Work

- [ ] Binary, hexadecimal, number representations
- [ ] Boolean algebra and logic gates
- [ ] Combinational circuits: adders, multiplexers
- [ ] Sequential circuits: flip-flops, registers
- [ ] The fetch-decode-execute cycle
- [ ] How a CPU actually executes an instruction

### Computer Architecture

- [ ] Von Neumann architecture
- [ ] Registers, ALU, control unit
- [ ] Memory hierarchy: registers, L1/L2/L3 cache, RAM, disk
- [ ] Cache lines, cache hits and misses, spatial and temporal locality
- [ ] Virtual memory and paging
- [ ] The memory model: stack, heap, data segment, text segment
- [ ] Interrupts and system calls
- [ ] Instruction set architectures: x86-64 basics, ARM basics
- [ ] Pipelining and branch prediction
- [ ] SIMD and vectorized instructions

### Assembly Language

- [ ] x86-64 assembly: registers, addressing modes, basic instructions
- [ ] Reading and writing simple assembly
- [ ] The calling convention: how functions pass arguments and return values
- [ ] Stack frames
- [ ] Reading compiler-generated assembly output

---

## 2. Python & Practical Software Engineering — CORE

### Python — Core Language

- [ ] Data types, mutability, memory model — _Fluent Python (Ramalho); CPython Internals (Shaw)_
- [ ] List/dict/set comprehensions — _Fluent Python; Python Cookbook (Beazley & Jones)_
- [ ] Generators and iterators — _Fluent Python; Python Cookbook; Beazley "Generators: The Final Frontier" (YouTube)_
- [ ] Decorators — _Fluent Python; Real Python_
- [ ] Context managers — _Fluent Python; Python Cookbook_
- [ ] Type hints and mypy — _mypy docs; PEP 526, 544, 585_
- [ ] Dataclasses and attrs — _Real Python_
- [ ] `__slots__`, `__repr__`, `__eq__` — dunder methods — _Fluent Python; Python Data Model docs_
- [ ] The GIL — _Fluent Python; CPython Internals; Beazley "Python Concurrency from the Ground Up" (YouTube)_
- [ ] Memory profiling — _CPython Internals; High Performance Python (Gorelick & Ozsvald)_

### Python — Testing

- [ ] pytest — _Python Testing with pytest (Okken, 2nd ed.)_
- [ ] unittest.mock — _official docs_
- [ ] Integration tests — _Architecture Patterns with Python_
- [ ] Property-based testing with Hypothesis — _Hypothesis docs_
- [ ] Test coverage — _Python Testing with pytest_
- [ ] Testing distributed systems — _Architecture Patterns with Python_
- [ ] Testcontainers — _Testcontainers Python docs_
- [ ] Performance benchmarking — _pytest-benchmark_

### Python — Performance + Production

- [ ] cProfile and line_profiler — _High Performance Python; cProfile + snakeviz; line_profiler_
- [ ] NumPy vectorisation — _High Performance Python_
- [ ] Pandas — _Python for Data Analysis (McKinney, 3rd ed.)_
- [ ] Polars — _Polars official docs_
- [ ] Cython and Numba — _High Performance Python; Numba official docs_
- [ ] ctypes and cffi — _CPython Internals_
- [ ] Struct packing/unpacking — _CPython Internals_
- [ ] Logging — _Architecture Patterns with Python (Percival & Gregory, free at cosmicpython.com)_
- [ ] Exception hierarchy — _Architecture Patterns with Python_
- [ ] Virtual environments, pyproject.toml, dependency pinning — _Architecture Patterns with Python_

### Practical Engineering Habits — ADD

- [ ] Git basics: commits, branches, merges, rebasing, pull requests
- [ ] Write readable modules and small interfaces before building large abstractions
- [ ] Debug with a debugger, logs, assertions, and minimal reproductions
- [ ] Read stack traces instead of guessing
- [ ] Write README files that explain architecture, setup, decisions, and benchmarks
- [ ] Learn to profile before optimizing
- [ ] Use unit tests for logic and integration tests for system boundaries

---

## 3. Parallel Application Track: Python for Financial Markets — APPLICATION

### Python — Finance & Trading Application

**Performance**

- [ ] NumPy vectorization for numerical array operations
- [ ] Numba for JIT compilation of Python functions to near-C speed
- [ ] Cython for compiling Python-like code to C
- [ ] Polars as a faster alternative to pandas for large datasets
- [ ] DuckDB for fast in-process analytical SQL on parquet/CSV data

**Market Data & Connectivity**

- [ ] ccxt for unified API access to 100+ crypto exchange order book and trade data
- [ ] websockets / websocket-client for real-time market data streams
- [ ] requests / httpx for REST API calls
- [ ] QuickFIX (quickfix-python) as a production-grade FIX engine reference

**Data Manipulation at Scale**

- [ ] pandas for time series resampling and rolling-window feature construction
- [ ] Polars for large-dataset processing
- [ ] PyArrow as the columnar interchange format across pandas, Polars, and DuckDB

**Backtesting Frameworks**

- [ ] VectorBT for fast, vectorized strategy idea triage
- [ ] NautilusTrader for realistic, order-book-level, event-driven backtest validation
- [ ] Backtesting.py as a minimal on-ramp
- [ ] QuantLib for derivatives pricing and yield curve construction
- [ ] TA-Lib for standard technical indicators
- [ ] _(Note: Backtrader excluded — in long-term maintenance mode since 2021–2023)_

**Machine Learning**

- [ ] scikit-learn as the baseline ML toolkit
- [ ] XGBoost / LightGBM for tabular prediction problems (e.g. order book imbalance → short-horizon price direction)
- [ ] PyTorch for sequential architectures (LSTM, Transformer) on tick data
- [ ] Stable-Baselines3 for reinforcement learning (PPO, SAC, TD3)
- [ ] Gymnasium as the environment interface for Stable-Baselines3
- [ ] statsmodels for ARIMA time series modeling
- [ ] arch for GARCH volatility modeling

**Visualization**

- [ ] Streamlit for interactive dashboards: positions, P&L, order book visualization
- [ ] Plotly / Dash as an alternative

**Capstone Projects**

- [ ] Capstone 1: Complete market data pipeline — ingest live order book/trade data via ccxt, engineer an order book imbalance feature, train an XGBoost model predicting short-horizon price direction, visualize live + historical performance in a Streamlit dashboard
- [ ] Capstone 2: Signal validation pipeline — triage a strategy idea with VectorBT across parameters, then port the surviving candidate into NautilusTrader for order-book-level validation including transaction costs and slippage

> Start this track early and revisit it as your systems/ML ability grows. Your first version can be simple; later versions should become more realistic, faster, and more reliable.

---

## 4. Data Structures & Algorithms — CORE

### Data Structures and Algorithms

- [ ] Arrays, linked lists, doubly linked lists
- [ ] Stacks and queues
- [ ] Hash tables: collision resolution, load factor, amortized analysis
- [ ] Trees: binary trees, BSTs, AVL trees, red-black trees
- [ ] Heaps and priority queues
- [ ] Graphs: adjacency list and matrix representations
- [ ] Sorting: merge sort, quicksort, heapsort, counting sort
- [ ] Searching: binary search, BFS, DFS
- [ ] Shortest paths: Dijkstra, Bellman-Ford, Floyd-Warshall
- [ ] Minimum spanning trees: Kruskal, Prim
- [ ] Dynamic programming
- [ ] Amortized analysis
- [ ] Big-O, Big-Theta, Big-Omega: what they actually mean

**Math Gap-Fill: Graph Theory & Recurrence Relations**

- [ ] Graph theory formal treatment: connectivity, trees (largely covered above; names the formal framing explicitly)
- [ ] Recurrence relations: solving divide-and-conquer recurrences, the Master Theorem, applied to the algorithms above

**DSA — Finance & Trading Application**

- [ ] Implement Dijkstra's shortest path algorithm to compute the lowest-cost execution route across a simulated set of liquidity venues
- [ ] Implement a combinatorial counting function to enumerate valid order book states given a fixed number of price levels and order sizes
- [ ] Model a limit order book's price-time priority queue as a graph traversal problem and implement it

---

---

## 5. C as a Systems Bridge — CORE, SHORT

### C

- [ ] Variables, types, operators
- [ ] Control flow
- [ ] Functions and the call stack
- [ ] Pointers: what they are, pointer arithmetic, pointer to pointer
- [ ] Arrays and strings as pointers
- [ ] Structs and unions
- [ ] Memory management: malloc, free, stack vs heap
- [ ] The C preprocessor
- [ ] Compilation pipeline: preprocessing, compilation, assembly, linking
- [ ] Header files, object files, static and shared libraries
- [ ] Undefined behavior and why it matters
- [ ] Common memory bugs: buffer overflow, use-after-free, double free, memory leaks
- [ ] Valgrind and memory debugging

**C — Finance & Trading Application**

- [ ] Manual memory management (malloc/free) as the conceptual foundation for why C++ dominates low-latency trading systems
- [ ] Buffer and struct-based message parsing as the basis for reading raw exchange protocol messages, prior to higher-level abstraction
- [ ] Historical and current use of C in minimal-overhead exchange gateway and FIX engine components

**C — Capstone Project**

- [ ] Implement a minimal market data client in C connecting to a raw socket feed (or parsing a static exchange-protocol file), using manual memory management for message buffers, verified free of leaks under repeated execution with Valgrind

> **Goal:** understand memory, pointers, compilation, layouts, buffers, and failure modes. Do not remain here indefinitely; C is preparation for your primary systems language, C++.

---

## 6. C++ — Primary Systems Language — CORE

### C++ Language Foundations

- [ ] Values, references, pointers, and object lifetimes
- [ ] `const` correctness
- [ ] Classes, structs, constructors, destructors
- [ ] RAII: resource acquisition is initialization
- [ ] Copy semantics vs move semantics
- [ ] Rule of Zero, Rule of Five
- [ ] Stack vs heap allocation in C++
- [ ] References vs pointers and when to use each
- [ ] `auto`, range-based loops, structured bindings
- [ ] Lambdas and captures
- [ ] Exceptions: mechanics, costs, and exception safety

### Standard Library & Generic Programming

- [ ] `std::vector`, `std::array`, `std::deque`, `std::list` — tradeoffs
- [ ] `std::map`, `std::unordered_map`, `std::set`, `std::unordered_set`
- [ ] `std::string`, `std::string_view`, spans
- [ ] Iterators and algorithms
- [ ] Templates: function and class templates
- [ ] Template specialization and basic metaprogramming intuition
- [ ] Smart pointers: `std::unique_ptr`, `std::shared_ptr`, `std::weak_ptr`
- [ ] `std::optional`, `std::variant`, `std::tuple`
- [ ] C++20 concepts at a practical level

### Memory, Layout & Performance

- [ ] Object layout, alignment, padding, and cache lines
- [ ] Contiguous vs pointer-heavy data structures
- [ ] Allocations and allocator overhead
- [ ] Custom allocators / memory pools conceptually
- [ ] False sharing
- [ ] Zero-copy design where appropriate
- [ ] Move semantics as a performance tool, not just syntax
- [ ] Undefined behavior and why optimized C++ makes it dangerous

### C++ Concurrency

- [ ] `std::thread`
- [ ] `std::mutex`, `std::lock_guard`, `std::unique_lock`
- [ ] Condition variables
- [ ] Futures and promises
- [ ] Atomics and memory ordering basics
- [ ] Thread pools
- [ ] Producer-consumer queues
- [ ] Lock contention and when lock-free structures help

### Build, Debugging & Tooling

- [ ] Compilation and linking in a multi-file C++ project
- [ ] CMake fundamentals
- [ ] `gdb` or `lldb`
- [ ] AddressSanitizer, UndefinedBehaviorSanitizer, ThreadSanitizer
- [ ] Valgrind where appropriate
- [ ] Compiler warnings (`-Wall`, `-Wextra`, etc.)
- [ ] Optimization levels and reading compiler output
- [ ] Google Benchmark or equivalent microbenchmarking
- [ ] `perf` and flamegraphs for C++ programs

### Modern C++

- [ ] C++17 features you encounter in production code
- [ ] C++20 features you encounter in production code
- [ ] Understand ownership conventions in a large codebase
- [ ] Read unfamiliar C++ code without needing to rewrite it first

### C++ — Finance & Trading Application

- [ ] C++ as the dominant language for many low-latency execution paths because it provides performance with explicit control over memory and object lifetime
- [ ] RAII for resource safety in systems handling sockets, files, memory, and live connections
- [ ] Implement price levels and order queues with data structures chosen after reasoning about access patterns and cache behavior
- [ ] Parse binary market-data messages into typed C++ structures
- [ ] Build a simple non-blocking market-data client
- [ ] Measure latency distributions rather than only average latency

### C++ — Capstone Projects

- [ ] **Capstone 1:** Port the Python limit order book matching engine to C++, using RAII-managed objects and a basic execution algorithm (TWAP) against simulated order flow
- [ ] **Capstone 2:** Build a binary market-data feed parser in C++; replay a recorded stream, reconstruct a simplified order book, benchmark throughput and p50/p95/p99 latency

---

## 7. Software Engineering Foundations — CORE, INTEGRATE THROUGHOUT

- [ ] Version control internals: how git actually works under the hood
- [ ] The object model of git: blobs, trees, commits, refs
- [ ] Building git from scratch conceptually
- [ ] How linkers work: symbol resolution, relocation
- [ ] How dynamic loaders work
- [ ] Build systems: make, cmake, how they reason about dependencies
- [ ] Testing: unit, integration, property-based testing
- [ ] Fuzzing: coverage-guided fuzzing with libFuzzer and AFL
- [ ] Formal verification: TLA+ for specifying distributed systems
- [ ] Code review in systems projects
- [ ] Technical writing for specifications and RFCs

> Treat Git, testing, build systems, code review, and technical writing as ongoing habits. Fuzzing and TLA+ can come later when your projects are large enough to justify them.

---

## 8. Operating Systems & Linux — CORE

### Processes and Threads

- [ ] What a process is: address space, file descriptors, process state
- [ ] The process lifecycle: fork, exec, wait, exit
- [ ] Context switching
- [ ] What a thread is: shared address space, independent stack
- [ ] POSIX threads: creating, joining, detaching
- [ ] Thread synchronization: mutexes, condition variables, semaphores
- [ ] Deadlock: conditions, detection, prevention
- [ ] Race conditions and data races
- [ ] Memory ordering and the happens-before relation

### Scheduling

- [ ] CPU scheduling algorithms: FIFO, round-robin, CFS
- [ ] Preemption
- [ ] The Linux CFS scheduler
- [ ] Priority and nice values
- [ ] Real-time scheduling

### Memory Management

- [ ] Virtual address spaces
- [ ] Paging and page tables
- [ ] The TLB
- [ ] Page faults and demand paging
- [ ] Copy-on-write
- [ ] Memory-mapped files: mmap
- [ ] The Linux memory allocator
- [ ] malloc internals: sbrk, brk, free lists

### File Systems

- [ ] Files, directories, inodes
- [ ] File system layout on disk
- [ ] The VFS layer in Linux
- [ ] ext4 internals
- [ ] Journaling and crash consistency
- [ ] The buffer cache
- [ ] File descriptors and the open file table
- [ ] Hard links and symbolic links

### I/O and System Calls

- [ ] The system call interface
- [ ] Read, write, open, close
- [ ] Blocking vs non-blocking I/O
- [ ] I/O multiplexing: select, poll, epoll
- [ ] The difference between buffered and unbuffered I/O
- [ ] Memory-mapped I/O

### The Linux Kernel

- [ ] Kernel space vs user space
- [ ] How system calls cross the boundary
- [ ] The kernel data structures: task_struct, mm_struct
- [ ] Kernel modules
- [ ] The Linux boot process
- [ ] Signals and signal handlers
- [ ] Namespaces and cgroups
- [ ] procfs and sysfs

### Practical Linux

- [ ] Shell and shell scripting
- [ ] Process management: ps, top, htop, kill, strace, ltrace
- [ ] File system tools: find, ls internals, df, du, lsof
- [ ] Network tools: ss, netstat, tcpdump, ip
- [ ] Performance tools: perf, flamegraphs, vmstat, iostat
- [ ] systemd and service management
- [ ] Building the Linux kernel from source
- [ ] Writing a simple kernel module

---

---

## 9. Networking — CORE

### Fundamentals

- [ ] The OSI model and why it's an abstraction — _Kurose & Ross, Ch. 1–3_
- [ ] The actual internet model: link, network, transport, application
- [ ] Packets, frames, datagrams
- [ ] MAC addresses and ARP
- [ ] IP addresses, subnetting, CIDR
- [ ] Routing: how packets find their way
- [ ] BGP at a conceptual level
- [ ] NAT and how it works

### Transport Layer

- [ ] UDP: connectionless, unreliable, why it's still useful — _Kurose & Ross_
- [ ] TCP: the three-way handshake, sequence numbers, acknowledgments — _Kurose & Ross_
- [ ] TCP reliability: retransmission, timeouts, sliding window
- [ ] TCP flow control and congestion control
- [ ] Nagle's algorithm
- [ ] TCP connection teardown
- [ ] TIME_WAIT and why it exists
- [ ] TCP state machine

### Application Layer

- [ ] DNS: how name resolution works end to end — _Kurose & Ross_
- [ ] HTTP/1.1: request-response, headers, status codes, keep-alive — _Kurose & Ross_
- [ ] HTTP/2: multiplexing, header compression, streams — _Kurose & Ross_
- [ ] HTTP/3 and QUIC
- [ ] TLS: handshake, certificates, certificate authorities, cipher suites — _Kurose & Ross_
- [ ] WebSockets — _Kurose & Ross_

### Sockets Programming

- [ ] The socket API: socket, bind, listen, accept, connect, send, recv — _Kurose & Ross_
- [ ] Writing a TCP server and client from scratch in C
- [ ] Writing a UDP server and client
- [ ] Non-blocking sockets and epoll
- [ ] Writing a simple HTTP server from scratch

### Distributed Networking

- [ ] Latency vs bandwidth
- [ ] The fallacies of distributed computing
- [ ] P2P networks: how nodes find each other
- [ ] DHTs: Kademlia
- [ ] Gossip protocols
- [ ] NAT traversal

---

### Python — Async + Concurrency (Study Here)

- [ ] async/await, coroutines, tasks, futures — _Using Asyncio in Python (Hattingh); Python Concurrency with asyncio (Fowler)_
- [ ] asyncio event loop — _Using Asyncio in Python; Fluent Python Ch. 19–21_
- [ ] asyncio.gather, asyncio.wait, timeouts and cancellation — _Using Asyncio in Python; asyncio official docs_
- [ ] I/O-bound vs CPU-bound — _Using Asyncio in Python; Python Concurrency with asyncio_
- [ ] threading.Thread and threading.Lock — _Python Concurrency with asyncio_
- [ ] multiprocessing.Pool — _Python Concurrency with asyncio_
- [ ] concurrent.futures — _official docs_
- [ ] aiohttp, httpx — _Python Concurrency with asyncio_
- [ ] asyncio queues — _Using Asyncio in Python_
- [ ] Profiling async code — _High Performance Python_

> Moving Python async here makes it easier to understand *why* event loops, non-blocking I/O, sockets, queues, cancellation, and concurrency exist.

---

## 10. Concurrency & Parallelism — CORE

- [ ] Amdahl's law
- [ ] The memory model: what reordering compilers and CPUs do
- [ ] Memory barriers and fences
- [ ] Atomic operations: compare-and-swap, fetch-and-add
- [ ] Lock-free data structures
- [ ] The ABA problem
- [ ] Lock-free queues and stacks
- [ ] Read-copy-update (RCU)
- [ ] Futexes: how mutexes are actually implemented
- [ ] Async I/O and event loops
- [ ] The reactor and proactor patterns
- [ ] Coroutines and async/await at the implementation level
- [ ] Thread pools
- [ ] Work stealing schedulers

---

---

## 11. Databases & Storage — CORE SPECIALIZATION PILLAR

### Storage Fundamentals

- [ ] How HDDs work: seek time, rotational latency, throughput
- [ ] How SSDs work: NAND flash, wear leveling, write amplification
- [ ] The difference between sequential and random access
- [ ] fsync and durability guarantees
- [ ] Write-ahead logging

### Database Internals

- [ ] B-trees and B+ trees: structure, insertion, deletion, why databases use them
- [ ] LSM trees: memtable, SSTables, compaction, why RocksDB uses them
- [ ] Buffer pools and page management
- [ ] Indexes: clustered vs non-clustered
- [ ] Query execution and query planning basics
- [ ] Transactions: ACID properties
- [ ] Concurrency control: locks, MVCC
- [ ] Isolation levels: read uncommitted through serializable
- [ ] Recovery: ARIES algorithm concepts
- [ ] WAL implementation

### PostgreSQL

- [ ] SELECT, JOIN, GROUP BY, HAVING, window functions — _SQL Performance Explained (Winand, free at use-the-index-luke.com)_
- [ ] Subqueries, CTEs, recursive CTEs — _SQL Performance Explained_
- [ ] EXPLAIN and EXPLAIN ANALYZE — _SQL Performance Explained_
- [ ] B-tree indexes — _SQL Performance Explained_
- [ ] Partial indexes, covering indexes — _SQL Performance Explained_
- [ ] Transactions, ACID, isolation levels — _Designing Data-Intensive Applications (Kleppmann)_
- [ ] Deadlocks — _DDIA_
- [ ] Vacuum, autovacuum — _PostgreSQL official docs_
- [ ] Connection pooling — _SQL Performance Explained_
- [ ] Partitioning — _DDIA_
- [ ] PostgreSQL internals at a level deeper than SQL

### ClickHouse

- [ ] Columnar storage — why ClickHouse exists — _ClickHouse docs_
- [ ] When to use ClickHouse over PostgreSQL — _ClickHouse docs_
- [ ] Basic ClickHouse queries and table design — _ClickHouse docs_

### RocksDB

- [ ] RocksDB: architecture, use cases, tuning

### SQLite

- [ ] SQLite: why it's everywhere, its design decisions

---

### Analytical Data Formats — ADD

- [ ] Row-oriented vs column-oriented storage
- [ ] Parquet internals at a practical level: row groups, column chunks, statistics
- [ ] Apache Arrow memory model and zero-copy interchange
- [ ] Compression and encoding basics: dictionary, run-length, delta encoding
- [ ] Partition pruning and predicate pushdown
- [ ] Why DuckDB is useful for local analytical workloads

---

## 12. Distributed Systems — CORE

### Theory

- [ ] The Two Generals Problem
- [ ] The Byzantine Generals Problem
- [ ] The FLP impossibility result
- [ ] CAP theorem: what it actually says and what it does not say — _DDIA_
- [ ] Consistency models: linearizability, sequential consistency, causal consistency, eventual consistency — _DDIA_
- [ ] The PACELC model

### Consensus

- [ ] Paxos: single-decree, multi-paxos
- [ ] Raft: leader election, log replication, safety — _Raft paper; Kleppmann Cambridge lectures (YouTube)_
- [ ] Byzantine fault tolerant consensus
- [ ] PBFT
- [ ] HotStuff
- [ ] Tendermint
- [ ] Nakamoto consensus: longest chain rule, probabilistic finality

### Clocks and Time

- [ ] Physical clocks and clock skew
- [ ] Logical clocks: Lamport timestamps — _DDIA; Kleppmann Cambridge lectures_
- [ ] Vector clocks — _DDIA_
- [ ] Hybrid logical clocks

### Replication

- [ ] Primary-backup replication
- [ ] Chain replication
- [ ] Quorum systems
- [ ] Conflict-free replicated data types (CRDTs)

### Practical Distributed Systems

- [ ] Leader election
- [ ] Distributed transactions: two-phase commit, three-phase commit — _DDIA_
- [ ] The saga pattern
- [ ] Idempotency — _DDIA_
- [ ] Exactly-once semantics: why it's hard — _DDIA_
- [ ] Heartbeats and failure detection — _DDIA_
- [ ] Backpressure — _DDIA_
- [ ] Circuit breakers
- [ ] Split-brain — _DDIA_
- [ ] Read the Dynamo paper, the Spanner paper, the Raft paper, the Kafka paper in full

---

---

## 13. Data Engineering Infrastructure — CORE SPECIALIZATION PILLAR

### Apache Kafka

- [ ] Append-only immutable log — _Kafka: The Definitive Guide (Shapira et al., free at Confluent)_
- [ ] Topics, partitions, offsets — _Kafka: The Definitive Guide_
- [ ] Producers: acks, retries, idempotent producers — _Kafka: The Definitive Guide; Confluent Developer courses_
- [ ] Consumer groups — _Kafka: The Definitive Guide_
- [ ] Offset management — _Kafka: The Definitive Guide_
- [ ] Replication factor, ISR, leader election — _Kafka: The Definitive Guide_
- [ ] Retention policies, log compaction — _Kafka: The Definitive Guide_
- [ ] Dead letter queues — _Kafka: The Definitive Guide_
- [ ] Consumer lag monitoring — _Kafka: The Definitive Guide; Confluent Developer courses_
- [ ] Schema Registry and Avro — _Confluent Developer courses; Kafka: The Definitive Guide_

### Streaming

- [ ] Event time vs processing time — _DDIA_
- [ ] Watermarks — _DDIA_
- [ ] Windows — tumbling, sliding, session — _DDIA_
- [ ] Stateful streaming — _DDIA_
- [ ] Checkpointing — _DDIA_
- [ ] Exactly-once in streaming — _DDIA_
- [ ] Apache Spark Structured Streaming — _Learning Spark (Damji et al., free at Databricks)_
- [ ] Apache Flink — _Flink official docs_
- [ ] Change Data Capture and Debezium — _Debezium docs_
- [ ] Outbox pattern — _DDIA_

### dbt

- [ ] Models — _dbt docs + courses.getdbt.com (free)_
- [ ] Staging, intermediate, mart layers — _dbt docs_
- [ ] Incremental models — _dbt docs_
- [ ] Tests — _dbt docs_
- [ ] Sources — _dbt docs_
- [ ] Macros — _dbt docs; Jinja + Macros free course_
- [ ] dbt docs and lineage graph — _dbt docs_

### Apache Airflow

- [ ] DAGs — _Data Pipelines with Apache Airflow (Harenslak & de Ruiter)_
- [ ] Operators — _Data Pipelines with Apache Airflow_
- [ ] Task dependencies — _Data Pipelines with Apache Airflow_
- [ ] Sensors — _Data Pipelines with Apache Airflow_
- [ ] Backfilling — _Data Pipelines with Apache Airflow; Airflow official docs_
- [ ] Execution date vs data interval — _Data Pipelines with Apache Airflow_
- [ ] TaskFlow API — _Data Pipelines with Apache Airflow_
- [ ] Kubernetes executor — _Data Pipelines with Apache Airflow_

---

### Data Modeling & Reliability — ADD

- [ ] OLTP vs OLAP workloads
- [ ] Normalized vs denormalized models
- [ ] Star and snowflake schemas at a practical level
- [ ] Slowly changing dimensions conceptually
- [ ] Idempotent pipelines
- [ ] Data contracts and schema evolution
- [ ] Backfills and replayability
- [ ] Data lineage
- [ ] Data quality checks and failure handling
- [ ] Batch vs streaming architecture tradeoffs

### Capstone — Financial Data Platform

- [ ] Ingest live market data -> normalize events -> publish through Kafka -> store raw history in Parquet -> store queryable aggregates in ClickHouse -> expose a small research API/dashboard
- [ ] Add replay/backfill support, data-quality checks, metrics, and recovery from a simulated component failure

---

## 14. Infrastructure, Cloud & Observability — SUPPORTING CORE

### Docker

- [ ] Dockerfile — _Docker Deep Dive (Poulton)_
- [ ] Multi-stage builds — _Docker Deep Dive_
- [ ] docker-compose — _Docker Deep Dive_
- [ ] Image layers and caching — _Docker Deep Dive_
- [ ] Volumes and bind mounts — _Docker Deep Dive_
- [ ] Networking modes — _Docker Deep Dive_
- [ ] Health checks — _Docker Deep Dive_
- [ ] Container registries — _Docker Deep Dive_

### Kubernetes + Cloud

- [ ] Pods, Deployments, Services, ConfigMaps, Secrets — _The Kubernetes Book (Poulton)_
- [ ] Persistent Volumes — _The Kubernetes Book_
- [ ] Helm — _The Kubernetes Book_
- [ ] Resource requests and limits — _The Kubernetes Book_
- [ ] Horizontal Pod Autoscaler — _The Kubernetes Book_
- [ ] AWS or GCP basics — _AWS docs; GCP docs_
- [ ] Terraform basics — _Terraform: Up & Running (Brikman, Ch. 1–3)_
- [ ] GitHub Actions for CI/CD — _GitHub Actions docs_

### Observability

- [ ] Prometheus — metrics collection — _Prometheus docs_
- [ ] Grafana — dashboards — _Grafana tutorials_
- [ ] Key indexer metrics — block lag, events per second, reorg count, write latency — _Observability Engineering (Majors, Fong-Jones, Miranda, free O'Reilly)_
- [ ] Structured logging — _Observability Engineering_
- [ ] Alerting — when your indexer falls behind — _Observability Engineering_

---

> **Order inside this section:** Docker -> one cloud provider -> CI/CD -> observability -> Terraform -> Kubernetes. Kubernetes is useful, but it is not a prerequisite for learning data engineering or ML.

---

## 15. Performance Engineering — CORE FOR SYSTEMS / TRADING / ML SYSTEMS

- [ ] Profiling: CPU profiling, memory profiling, I/O profiling
- [ ] Flamegraphs: reading and interpreting them
- [ ] Benchmarking correctly: avoiding microbenchmark pitfalls
- [ ] Cache-friendly data structures
- [ ] Branch prediction optimization
- [ ] SIMD intrinsics
- [ ] Memory allocator tuning
- [ ] Lock contention analysis
- [ ] Perf and eBPF
- [ ] Continuous performance testing

---

### Additional Performance Topics — ADD

- [ ] Latency vs throughput vs tail latency
- [ ] p50 / p95 / p99 / p99.9 latency
- [ ] CPU cache behavior and data-oriented design
- [ ] NUMA basics
- [ ] System call overhead and context-switch cost
- [ ] Copying vs zero-copy data paths
- [ ] Network latency measurement
- [ ] Benchmark end-to-end systems, not only isolated functions

---

## 16. Optimization & Classical Machine Learning — CORE

### Math Gap-Fill: Optimization Theory

- [ ] Minima, maxima, and saddle points
- [ ] Convex sets and convex functions
- [ ] Unconstrained optimization: gradient descent and Newton's method
- [ ] Stochastic Gradient Descent (SGD) and backpropagation basics
- [ ] Constrained optimization: Lagrange multipliers
- [ ] Karush-Kuhn-Tucker (KKT) conditions
- [ ] Linear programming and integer programming basics

**Optimization — Finance & Trading Application**

- [ ] Implement gradient descent from first principles (no PyTorch/scikit-learn) to fit a linear model predicting short-horizon price change from order book imbalance
- [ ] Implement the Almgren-Chriss optimal execution trajectory using Lagrange multipliers on a constrained cost function

### Classical ML & Evaluation (Bloomberg Interview Coverage)

- [ ] Logistic regression: derivation, decision boundary, when preferred over more complex models
- [ ] k-Nearest Neighbors: the algorithm, distance metrics, the curse of dimensionality
- [ ] Naive Bayes: the independence assumption, why it performs well despite being technically "wrong"
- [ ] Decision trees: splitting criteria (Gini impurity, information gain/entropy), overfitting, pruning — distinct from the gradient-boosted ensembles (XGBoost/LightGBM) covered earlier
- [ ] Support Vector Machines: margin maximization intuition, the kernel trick, when preferred over trees or neural networks
- [ ] k-means clustering: the algorithm, choosing k, limitations
- [ ] Hierarchical clustering: agglomerative vs divisive, dendrograms
- [ ] Classification evaluation metrics: precision, recall, F1, ROC curve, AUC, confusion matrix — and when accuracy alone is misleading
- [ ] Regression evaluation metrics: RMSE, MAE, R²

- [ ] Supervised vs unsupervised learning — _Hands-On Machine Learning (Géron, Parts 1–2)_
- [ ] Bias-variance tradeoff — _Hands-On Machine Learning_
- [ ] Train/validation/test split — _Hands-On Machine Learning_
- [ ] Cross-validation — TimeSeriesSplit for on-chain data — _Hands-On Machine Learning; Advances in Financial ML (Lopez de Prado)_
- [ ] Feature engineering from on-chain data — wallet age, transaction frequency, protocol interactions — _Advances in Financial ML_
- [ ] Anomaly detection — isolation forest, DBSCAN on transaction patterns — _Hands-On Machine Learning_
- [ ] scikit-learn — _Hands-On Machine Learning_
- [ ] SHAP values — _Advances in Financial ML; Hands-On Machine Learning_
- [ ] MLflow — tracking experiments — _MLflow official docs_

---

### Additional Statistical ML Foundations — ADD

- [ ] Linear regression from first principles
- [ ] Regularization: L1 vs L2
- [ ] Maximum likelihood estimation intuition
- [ ] Calibration and probabilistic predictions
- [ ] Class imbalance
- [ ] Feature leakage and target leakage
- [ ] Time-series leakage and walk-forward validation
- [ ] Baselines before complex models

---

## 17. Deep Learning Foundations — NEW CORE

### Neural Network Foundations

- [ ] From linear models to perceptrons and multilayer perceptrons
- [ ] Activation functions: ReLU, GELU, sigmoid, tanh
- [ ] Loss functions: MSE, cross-entropy, negative log-likelihood
- [ ] Computational graphs
- [ ] Backpropagation from first principles
- [ ] Automatic differentiation: what PyTorch autograd is doing conceptually
- [ ] Gradient checking

### Training Neural Networks

- [ ] SGD, momentum, RMSProp, Adam, AdamW
- [ ] Learning-rate schedules and warmup
- [ ] Weight initialization
- [ ] Batch normalization and layer normalization
- [ ] Dropout and other regularization methods
- [ ] Gradient clipping
- [ ] Vanishing and exploding gradients
- [ ] Overfitting, underfitting, and capacity
- [ ] Training curves and diagnosing failed training runs

### PyTorch — Deeply, Not Just API Usage

- [ ] Tensors, shapes, broadcasting, dtypes, devices
- [ ] `nn.Module`, parameters, optimizers, training loops
- [ ] Datasets and DataLoaders
- [ ] Autograd mechanics
- [ ] Custom modules and losses
- [ ] Checkpointing and reproducibility
- [ ] Mixed precision basics
- [ ] Profile a PyTorch training loop

### Sequence Models & Representation Learning

- [ ] Embeddings
- [ ] RNNs and LSTMs: understand why they mattered and their limitations
- [ ] Encoder-decoder architectures conceptually
- [ ] Representation learning

### Attention & Transformers

- [ ] Query, key, value intuition
- [ ] Scaled dot-product attention
- [ ] Multi-head attention
- [ ] Positional encodings / positional representations
- [ ] Transformer blocks
- [ ] Residual connections and normalization
- [ ] Causal masking
- [ ] Encoder-only vs decoder-only vs encoder-decoder models

### Language Models

- [ ] Tokenization: BPE / unigram intuition
- [ ] Next-token prediction objective
- [ ] Pretraining vs fine-tuning
- [ ] Instruction tuning conceptually
- [ ] Preference optimization / RLHF at a conceptual level
- [ ] Context windows and KV cache intuition
- [ ] Sampling: temperature, top-k, top-p
- [ ] Evaluation and benchmark limitations
- [ ] Retrieval-augmented generation as a systems pattern

### Deep Learning — Finance Applications

- [ ] Build a simple MLP baseline on engineered market features
- [ ] Compare the neural model against linear and tree-based baselines
- [ ] Build a sequence model on market/event data only after establishing leakage-safe baselines
- [ ] Treat predictive performance as an empirical question; do not assume a Transformer beats simpler models

### Deep Learning — Capstone

- [ ] Implement a tiny neural network and backpropagation from scratch using NumPy
- [ ] Implement a small Transformer language model in PyTorch
- [ ] Train it on a manageable dataset, record experiments, and explain every major tensor shape and training decision

---

## 18. ML Research Foundations — NEW CORE

### Research Method

- [ ] Turn a vague idea into a falsifiable hypothesis
- [ ] Establish a simple baseline first
- [ ] Design train/validation/test splits that match the real deployment setting
- [ ] Control variables where possible
- [ ] Run ablations: remove one component and measure what changes
- [ ] Hyperparameter search without contaminating the test set
- [ ] Error analysis
- [ ] Reproducibility: seeds, configs, environment, dataset versions
- [ ] Track experiments and negative results
- [ ] Report uncertainty rather than only point estimates

### Reading & Reproducing Research

- [ ] Read papers by identifying: problem, prior work, method, data, loss, metrics, baselines, ablations, limitations
- [ ] Reproduce a small result before attempting a novel extension
- [ ] Compare implementation details against the paper instead of trusting a library abstraction
- [ ] Learn to inspect research codebases
- [ ] Write short research notes explaining what you tried and what failed

### Scaling & Data

- [ ] Scaling-law intuition
- [ ] Dataset quality vs dataset quantity
- [ ] Data deduplication and contamination conceptually
- [ ] Distribution shift
- [ ] Curriculum / sampling strategies conceptually
- [ ] Evaluation design and benchmark gaming

### Research Engineering Habits

- [ ] Config-driven experiments
- [ ] Checkpointing and resuming long runs
- [ ] Deterministic vs nondeterministic GPU operations
- [ ] Experiment dashboards and artifact tracking
- [ ] Build reusable data loaders and evaluation harnesses without over-engineering them

---

## 19. ML Engineering & Infrastructure — CORE, AFTER ML FOUNDATIONS

### The ML System Lifecycle

- [ ] Data collection and labeling
- [ ] Feature engineering and the training/serving skew problem
- [ ] Model development and experimentation
- [ ] Model deployment: batch vs online inference
- [ ] Monitoring and continual learning
- [ ] The lifecycle as a loop, not a line — why models degrade and require retraining

### Feature Stores

- [ ] What a feature store solves: consistency between training-time and serving-time feature computation
- [ ] Offline store vs online store
- [ ] Feast: architecture and basic usage
- [ ] Point-in-time correctness: why naive feature joins leak future information into training data

### Data Versioning & Validation

- [ ] DVC (Data Version Control): versioning datasets and models alongside code
- [ ] Great Expectations: automated data quality validation in a pipeline
- [ ] Schema validation and data contracts between pipeline stages

### Distributed Training

- [ ] Data parallelism vs model parallelism
- [ ] PyTorch DistributedDataParallel (DDP)
- [ ] Gradient accumulation and mixed precision training
- [ ] Parameter servers, conceptually
- [ ] Horovod as an alternative distributed training framework

### Model Serving

- [ ] Batch inference vs real-time/online inference — when each is appropriate
- [ ] TorchServe and Triton Inference Server: architecture and basic deployment
- [ ] ONNX: exporting models across frameworks for serving flexibility
- [ ] Model quantization and other latency-reduction techniques for inference
- [ ] Batching strategies for throughput vs latency tradeoffs at serving time

### Model Registries & Deployment Patterns

- [ ] MLflow Model Registry specifically — versioning, staging, promotion to production (distinct from experiment tracking above)
- [ ] A/B testing for models in production
- [ ] Canary deployments and shadow deployments for new model versions
- [ ] Rollback strategies when a deployed model underperforms

### ML-Specific Monitoring & Observability

- [ ] Data drift: detecting when production input data no longer resembles training data
- [ ] Concept drift: detecting when the relationship between inputs and outputs has changed
- [ ] Model performance monitoring in production, distinct from infrastructure monitoring already covered
- [ ] Evidently AI or WhyLabs as concrete tools for drift detection

### ML Pipeline Orchestration

- [ ] Why general-purpose orchestration (Airflow) is often insufficient for ML-specific workflows
- [ ] Kubeflow Pipelines: architecture and use cases
- [ ] Metaflow as a lighter-weight alternative

### Vector Databases & Embeddings Infrastructure

- [ ] What an embedding is and why it needs specialized storage
- [ ] Approximate nearest neighbor search: the core problem vector databases solve
- [ ] pgvector, Pinecone, or Weaviate: architecture and basic usage
- [ ] Why this matters increasingly across both finance (semantic search over research/filings) and Web3 (on-chain data embeddings)

### MLOps CI/CD

- [ ] Automated retraining triggers: schedule-based vs performance-degradation-based
- [ ] Integrating model registries into deployment pipelines (building on Docker/Kubernetes/GitHub Actions)
- [ ] Testing ML code specifically: beyond unit tests, testing data assumptions and model behavior

### Real-Time & Streaming ML

- [ ] Online learning: updating a model incrementally as new data arrives, rather than full retraining
- [ ] Feature computation directly on streaming data (connects to Kafka-based Frost/Jars projects)
- [ ] The latency budget problem: computing features and running inference within a real-time system's time constraints

### Capstone Projects

- [ ] Capstone 1: Take the order book imbalance model (from Python Finance & Trading Application) and build real serving infrastructure — package with TorchServe or a FastAPI wrapper, register in MLflow's Model Registry, implement basic drift monitoring on incoming feature distributions
- [ ] Capstone 2: Extend Frost or Jars with a feature store layer — compute a feature (e.g. order book imbalance, rolling volatility) once, serve it consistently to both a training pipeline and a live inference path, demonstrating point-in-time correctness directly

**Primary resources:** _Designing Machine Learning Systems_ (Chip Huyen) as the backbone; _Machine Learning Design Patterns_ (Lakshmanan, Robinson, Munn) as a secondary reference.

---

> Do this *after* you can train and evaluate models yourself. Feature stores, model registries, orchestration, and serving are useful because they solve problems you should first experience directly.

---

## 20. GPU & High-Performance ML Systems — CORE LATER

### GPU Fundamentals

- [ ] CUDA basics: what actually runs on a GPU vs a CPU, and why
- [ ] GPU execution model: kernels, threads, blocks, grids
- [ ] Warps and SIMT execution
- [ ] GPU memory hierarchy: registers, shared memory, global memory, caches
- [ ] Coalesced memory access
- [ ] Compute-bound vs memory-bound operations
- [ ] Arithmetic intensity and roofline intuition

### CUDA / Triton Practice

- [ ] Write simple CUDA kernels
- [ ] Implement vector addition and reductions
- [ ] Implement / study tiled matrix multiplication
- [ ] Profile kernels and identify bottlenecks
- [ ] Triton basics for writing custom ML kernels
- [ ] Understand kernel fusion conceptually
- [ ] FlashAttention: understand the memory-I/O idea before implementation details

### Distributed Training Systems

- [ ] Data parallelism vs tensor/model/pipeline parallelism
- [ ] PyTorch DistributedDataParallel deeply enough to reason about communication
- [ ] All-reduce and collective communication
- [ ] NCCL conceptually and practically
- [ ] Gradient accumulation
- [ ] Mixed precision: FP32, FP16, BF16
- [ ] Checkpointing large models
- [ ] Communication vs computation bottlenecks

### Inference Performance

- [ ] Batching and dynamic batching
- [ ] Quantization concepts
- [ ] KV-cache memory costs for autoregressive models
- [ ] Throughput vs latency tradeoffs
- [ ] Model serving under concurrent load
- [ ] Profiling CPU-GPU transfer overhead

### Capstone — ML Systems

- [ ] Train the same model on one GPU and multiple GPUs; measure scaling efficiency and explain where performance is lost
- [ ] Implement one small custom CUDA or Triton kernel and benchmark it against a baseline

---

# SPECIALIZATION BRANCHES

The sections below remain in your roadmap, but they are **not prerequisites** for becoming strong in data engineering, ML research engineering, or financial systems. Enter them when a project or career direction creates a reason.

---

## 21. On-Chain / Blockchain Data Engineering — OPTIONAL SPECIALIZATION

> Recommended order inside this specialization: blockchain fundamentals -> Ethereum/RPC/events -> build an indexer -> DeFi datasets -> multi-chain -> deeper consensus/storage/ZK only as needed.

### Blockchain Fundamentals

- [ ] Why blockchains are hostile databases — _Mastering Ethereum (Antonopoulos & Wood, free online)_
- [ ] What a block is — _Mastering Ethereum_
- [ ] The chain structure — _Mastering Ethereum_
- [ ] The UTXO model vs the account model — _Mastering Ethereum_
- [ ] Why UTXO is harder to index — _Mastering Ethereum_
- [ ] Merkle trees in blockchain context — _Mastering Ethereum_
- [ ] Merkle Patricia Tries — Ethereum world state — _Mastering Ethereum_
- [ ] Block structure: header, transactions, nonces
- [ ] Transaction lifecycle: creation, propagation, mempool, inclusion, finality
- [ ] Forks: soft forks, hard forks, chain reorganizations
- [ ] Why you cannot query blockchain data directly — _Mastering Ethereum_
- [ ] What an indexer does — _Mastering Ethereum_
- [ ] Hash functions — SHA-256, Keccak-256 — _Mastering Ethereum_
- [ ] Why hashes link blocks — _Mastering Ethereum_
- [ ] Public-key cryptography — ECDSA, secp256k1 — _Mastering Ethereum_
- [ ] Wallet addresses — _Mastering Ethereum_
- [ ] Digital signatures — _Mastering Ethereum_
- [ ] Finality — probabilistic vs economic — _Mastering Ethereum_

### Consensus in Blockchain

- [ ] Nakamoto PoW in detail
- [ ] Mining difficulty adjustment
- [ ] Selfish mining and other attacks
- [ ] Proof of Work — Bitcoin — _Mastering Ethereum_
- [ ] Proof of Stake: validator sets, slashing conditions, finality — _Mastering Ethereum_
- [ ] Gasper: the consensus mechanism of Ethereum post-merge
- [ ] Tendermint BFT in detail
- [ ] MEV: maximal extractable value, its implications

### The EVM & Ethereum Architecture

- [ ] The EVM execution model — stack-based virtual machine — _ethereum.org developer docs_
- [ ] The stack, memory, storage, calldata
- [ ] Opcodes and gas costs
- [ ] Gas, gas price, gas limit — _ethereum.org docs_
- [ ] EIP-1559 — base fee and priority fee — _ethereum.org docs_
- [ ] The mempool — _ethereum.org docs_
- [ ] The state trie: Merkle Patricia Trie structure
- [ ] Account types: externally owned and contract accounts
- [ ] Transaction structure — nonce, gas price, gas limit, to, value, data, signature — _ethereum.org docs_
- [ ] Transaction receipts — status, gas used, logs emitted — _ethereum.org docs_
- [ ] Logs and events — _ethereum.org docs_
- [ ] Topics — event signature hash and indexed parameters — _ethereum.org docs_
- [ ] The ABI encoding — encoding/decoding contract calls and events — _ethereum.org docs_
- [ ] RLP encoding — _ethereum.org docs_
- [ ] Smart contracts — what they are, how they execute — _ethereum.org docs_
- [ ] The CALL opcode — internal transactions — _ethereum.org docs_
- [ ] Why internal transactions are invisible without debug_traceTransaction — _ethereum.org docs_
- [ ] EVM bytecode and how Solidity compiles to it
- [ ] Token standards — ERC-20, ERC-721, ERC-1155 — _ethereum.org docs_
- [ ] The Transfer event — decode from scratch — _ethereum.org docs_
- [ ] Full node vs archive node — _ethereum.org docs_
- [ ] JSON-RPC API — eth_getBlockByNumber, eth_getLogs, eth_call, eth_subscribe — _ethereum.org docs_
- [ ] debug_traceTransaction — _ethereum.org docs_
- [ ] Node providers — Alchemy, QuickNode — _Alchemy docs; QuickNode docs_

### P2P Networking in Blockchain

- [ ] devp2p protocol
- [ ] libp2p architecture
- [ ] Kademlia DHT in Ethereum
- [ ] Block and transaction propagation
- [ ] Eclipse attacks and Sybil attacks

### Bitcoin + UTXO Chains

- [ ] Bitcoin's UTXO model in depth — _Mastering Bitcoin (Antonopoulos, free online)_
- [ ] scriptPubKey and scriptSig — _Mastering Bitcoin_
- [ ] SegWit — _Mastering Bitcoin_
- [ ] Bitcoin RPC — bitcoind — _Bitcoin Core RPC docs_
- [ ] Indexing UTXO chains — tracking the UTXO set, computing wallet balances — _Bitcoin Core RPC docs_
- [ ] Bitcoin analytics — address clustering, entity labelling — _Mastering Bitcoin_

### Solana

- [ ] Solana's account model — everything is an account — _Solana docs_
- [ ] Programs vs accounts — programs are stateless — _Solana docs_
- [ ] Program Derived Addresses — _Solana docs_
- [ ] Transaction structure — one or more instructions executed atomically — _Solana docs_
- [ ] Proof of History — the cryptographic clock — _Solana docs_
- [ ] Solana RPC methods — _Solana docs_
- [ ] The Geyser plugin — streaming full ledger data in real time — _Solana docs_
- [ ] SPL Token program — _Solana Program Library docs_
- [ ] Anchor framework and IDL for decoding — _Anchor docs_
- [ ] Decoding Solana transactions — _Helius docs_
- [ ] Helius and QuickNode for Solana — _Helius docs; QuickNode docs_

### Layer 2s + Multi-Chain

- [ ] Why L2s exist — _ethereum.org/layer-2_
- [ ] Optimistic rollups — Arbitrum, Optimism, Base — _ethereum.org/layer-2_
- [ ] ZK rollups — zkSync, StarkNet, Polygon zkEVM — _ethereum.org/layer-2_
- [ ] The sequencer — _ethereum.org/layer-2_
- [ ] EIP-4844 — blobs and cheaper L2 data — _ethereum.org docs_
- [ ] Indexing L2s — same architecture, different endpoint — _Alchemy docs_
- [ ] Cross-chain indexing — unified schema across chains — _Goldsky docs_

### ZK in Blockchain

- [ ] zkEVM: what it is and why it's hard
- [ ] ZK rollups vs optimistic rollups
- [ ] The prover and verifier architecture
- [ ] Proof generation costs and verification costs
- [ ] Recursion and proof aggregation

### Storage in Blockchain

- [ ] State growth problem
- [ ] State pruning strategies
- [ ] Snap sync
- [ ] Portal network
- [ ] Statelessness and verkle trees

---

### Web3 Data Engineering Primitives

- [ ] Setting up Alchemy or QuickNode — _Alchemy docs_
- [ ] Making JSON-RPC calls with web3.py — _web3.py docs_
- [ ] Subscribing to new blocks via WebSocket — _web3.py docs_
- [ ] Subscribing to pending transactions — the mempool — _web3.py docs_
- [ ] Fetching transaction receipts — _web3.py docs_
- [ ] Fetching logs with eth_getLogs — _ethereum.org docs_
- [ ] Rate limiting and retry logic with exponential backoff — _web3.py docs_
- [ ] Handling chain reorganisations — _ethereum.org docs_
- [ ] ABI decoding with web3.py — _web3.py docs_
- [ ] Decoding ERC-20 Transfer events end to end — _web3.py docs_
- [ ] Decoding ERC-721 Transfer events — _web3.py docs_
- [ ] Handling hex encoding — _web3.py docs_
- [ ] Checksummed addresses — _ethereum.org docs_
- [ ] Handling uint256 — _web3.py docs_
- [ ] Decoding internal transactions with trace_transaction — _ethereum.org docs_
- [ ] The four-byte function selector — _ethereum.org docs_
- [ ] Indexer architecture — WebSocket to decode to database — _ethereum.org docs_
- [ ] Schema design for indexed events — _DDIA_
- [ ] Handling backfilling with eth_getLogs block ranges — _ethereum.org docs_
- [ ] Checkpoint management — _DDIA_
- [ ] Idempotent writes with upsert — _DDIA_
- [ ] Parallelising block ingestion — _DDIA_
- [ ] The Graph Protocol — when to use it vs rolling your own — _The Graph docs_

### DeFi Data Engineering

- [ ] AMMs — no order book, liquidity in pools, price set by formula — _Uniswap V2 docs_
- [ ] The constant product formula — x × y = k — _Uniswap V2 docs_
- [ ] Slippage and price impact — _Uniswap V2 docs_
- [ ] Uniswap V2 — parse Swap events, compute execution price — _Uniswap V2 docs_
- [ ] Uniswap V3 — concentrated liquidity, ticks — _Uniswap V3 docs_
- [ ] Lending protocols — Aave, Compound — supply, borrow, liquidate, health factor — _Aave docs; Compound docs_
- [ ] Liquidations — health factor below 1, cascade risk — _Aave docs_
- [ ] Stablecoin mechanics — _supplement with current literature_
- [ ] Oracles — Chainlink price feeds, oracle manipulation attacks — _Chainlink docs_
- [ ] MEV — what it is and why it matters — _Flashbots docs_
- [ ] Frontrunning, backrunning, sandwich attacks — _Flashbots docs_
- [ ] Arbitrage — the simplest MEV strategy — _Flashbots docs_
- [ ] Liquidation MEV — _Flashbots docs_
- [ ] Flashloans — _Aave docs_
- [ ] Flashbots and MEV-Boost — _Flashbots docs_
- [ ] Tracking DEX prices from Swap events — _Uniswap V2 docs_
- [ ] Building a liquidity depth chart from Mint and Burn events — _Uniswap V3 docs_
- [ ] Tracking lending protocol health from events — _Aave docs_
- [ ] TVL computation — how to do it correctly — _DefiLlama methodology_
- [ ] Wallet profiling — transaction history, PnL computation — _ethereum.org docs_
- [ ] Dune Analytics — learn the schema, write real queries — _Dune docs_
- [ ] On-chain volume and gas analytics — _Dune docs_

---

### On-Chain ML Applications

- [ ] Wallet/entity classification as a supervised or weakly supervised learning problem
- [ ] Anomaly detection on transaction graphs and flows
- [ ] Graph representations of wallets, protocols, and transfers
- [ ] Leakage-safe time-based evaluation for on-chain prediction tasks
- [ ] Natural-language-to-SQL over curated on-chain datasets
- [ ] Use LLMs for research interfaces only after building trustworthy underlying datasets and evaluation

### Capstone — Dune-Like Mini Platform

- [ ] Index one EVM chain -> store raw blocks/transactions/logs -> decode selected contracts -> create curated SQL tables -> expose query + dashboard functionality
- [ ] Add one ML/LLM layer only after the data model is reliable

---

## 22. Compilers & Programming Languages — LATER / OPTIONAL SPECIALIZATION

### Compilation Pipeline

- [ ] Lexing and tokenization
- [ ] Parsing: context-free grammars, recursive descent, operator precedence
- [ ] Abstract syntax trees
- [ ] Semantic analysis and type checking
- [ ] Intermediate representations
- [ ] Code generation
- [ ] Optimization passes: constant folding, dead code elimination, inlining

### Runtime Systems

- [ ] How garbage collection works: mark-and-sweep, generational GC, reference counting
- [ ] The tradeoffs between GC strategies
- [ ] Stack unwinding and exception handling
- [ ] Dynamic linking and the PLT/GOT
- [ ] JIT compilation

### Type Systems

- [ ] Type inference
- [ ] Hindley-Milner type system
- [ ] Algebraic data types
- [ ] Parametric polymorphism
- [ ] Dependent types at a conceptual level

---

> Keep the compilation/linking/runtime concepts you need for C++ early; full compiler construction and advanced type systems can wait unless you become interested in compiler or language engineering.

---

## 23. Cryptography — LATER / OPTIONAL SPECIALIZATION

### Foundations

- [ ] Information-theoretic vs computational security
- [ ] Perfect secrecy and the one-time pad
- [ ] Pseudorandomness and PRGs
- [ ] Hash functions: properties, collision resistance, preimage resistance
- [ ] SHA-256 and Keccak internals
- [ ] Message authentication codes (MACs) and HMACs

### Symmetric Cryptography

- [ ] Block ciphers: AES internals
- [ ] Modes of operation: ECB, CBC, CTR, GCM
- [ ] Stream ciphers
- [ ] Authenticated encryption

### Asymmetric Cryptography

- [ ] The discrete logarithm problem
- [ ] Diffie-Hellman key exchange
- [ ] RSA: key generation, encryption, signing, why padding matters
- [ ] Elliptic curve cryptography: groups on elliptic curves, point addition
- [ ] ECDSA: signing and verification
- [ ] EdDSA and Ed25519
- [ ] Key derivation functions

### Advanced Cryptography (for blockchain specifically)

- [ ] Merkle trees and Merkle proofs
- [ ] Commitment schemes
- [ ] Zero-knowledge proofs: what it means to prove without revealing
- [ ] Interactive vs non-interactive proofs
- [ ] SNARKs: high-level construction, polynomial commitments, the trusted setup
- [ ] STARKs: FRI protocol, no trusted setup
- [ ] PLONK at a conceptual and then mathematical level
- [ ] Pairing-based cryptography: bilinear pairings, BLS signatures

---

> Hashes, signatures, TLS-level concepts, and public-key cryptography are useful general knowledge. SNARKs, STARKs, PLONK, pairings, and advanced ZK should remain specialization material unless you deliberately pursue cryptography/blockchain research.

---

## 24. Rust — OPTIONAL SECOND SYSTEMS LANGUAGE

### Rust — Core Language

- [ ] Ownership — every value has exactly one owner — _The Rust Book; Rustlings_
- [ ] Move semantics — _The Rust Book_
- [ ] Borrowing — immutable and mutable references — _The Rust Book_
- [ ] The borrow checker — _The Rust Book_
- [ ] Lifetimes — _The Rust Book_
- [ ] Structs, enums, pattern matching — _The Rust Book_
- [ ] Traits and generics — _The Rust Book; Jon Gjengset Crust of Rust (YouTube)_
- [ ] Error handling: Result and Option — _The Rust Book_
- [ ] The ? operator — _The Rust Book_
- [ ] Closures and iterators — _The Rust Book_
- [ ] Vec and HashMap — _The Rust Book_
- [ ] String vs &str — _The Rust Book_
- [ ] Concurrency primitives: threads, channels, Arc, Mutex — _The Rust Book; Jon Gjengset Crust of Rust_
- [ ] Unsafe Rust and what it unlocks — _The Rust Book_
- [ ] The standard library — _The Rust Book_
- [ ] Cargo and the ecosystem — _The Rust Book_

### Rust — Async Rust

- [ ] Tokio — the async runtime — _Tokio tutorial_
- [ ] async/await in Rust — _Tokio tutorial_
- [ ] tokio::spawn — _Tokio tutorial_
- [ ] tokio::select! — _Tokio tutorial_
- [ ] tokio::sync::mpsc channels — _Tokio tutorial_
- [ ] WebSocket in Rust with tokio-tungstenite — _tokio-tungstenite docs_
- [ ] HTTP in Rust with reqwest — _reqwest docs_
- [ ] The alloy crate — Ethereum types in Rust — _alloy docs_

**Rust — Finance & Trading Application**

- [ ] Rust's increasing adoption in high-performance trading and blockchain infrastructure, combining memory safety with performance comparable to C++ absent a garbage collector
- [ ] The alloy crate for typed interaction with Ethereum-compatible chains, directly applicable to on-chain market data ingestion
- [ ] Tokio and tokio-tungstenite for asynchronous, concurrent WebSocket market data ingestion

**Rust — Capstone Project**

- [ ] Build a real-time crypto market data ingestion service in Rust using tokio + tokio-tungstenite to stream live order book updates from a crypto exchange WebSocket feed, optionally extended with alloy for on-chain DEX event data

> Because **C++ is your chosen systems language**, do not run C++ and Rust as equal parallel tracks. Return to Rust if you later move deeply into blockchain infrastructure, memory-safe systems programming, or a Rust-heavy team/codebase.

---

# Recommended Core Sequence

1. Foundations of Computation
2. Python & Practical Software Engineering
3. Data Structures & Algorithms
4. C as a short systems bridge
5. C++ deeply
6. Operating Systems & Linux
7. Networking
8. Concurrency & Parallelism
9. Databases & Storage
10. Distributed Systems
11. Data Engineering Infrastructure
12. Infrastructure / Cloud / Observability
13. Performance Engineering
14. Optimization & Classical ML
15. Deep Learning Foundations
16. ML Research Foundations
17. ML Engineering & Infrastructure
18. GPU & High-Performance ML Systems

**Run the Financial Markets application track throughout.**

Only then deliberately branch harder into:

- On-chain / blockchain data engineering
- Advanced compilers / languages
- Advanced cryptography / ZK
- Rust

### One rule for the whole roadmap

> **Do not measure progress by how many boxes you have seen. Measure it by what you can explain, implement, debug, benchmark, and build without hand-holding.**