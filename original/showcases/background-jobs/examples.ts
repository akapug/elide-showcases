import { enqueue_job, process_job, get_queue_stats } from "./job_queue.rb";

const job1 = enqueue_job("email", { to: "user@example.com", subject: "Hello" });
console.log("Enqueued:", job1);

const job2 = enqueue_job("export", { format: "pdf", data: "..." });
console.log("Enqueued:", job2);

console.log("Stats before:", get_queue_stats());

process_job();
process_job();

console.log("Stats after:", get_queue_stats());
