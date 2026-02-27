#!/usr/bin/env node
import { Command } from "commander";
import { cmdInit } from "./commands/init.js";
import { cmdStateInspect } from "./commands/stateInspect.js";
import { cmdStateRollback } from "./commands/stateRollback.js";
import { cmdHitlPending } from "./commands/hitlPending.js";
import { cmdHitlResolve } from "./commands/hitlResolve.js";
import { cmdExport } from "./commands/exportSkill.js";
import { cmdGraphRender } from "./commands/graphRender.js";
import { cmdChaosSpawn } from "./commands/chaosSpawn.js";
import { cmdStateMutate } from "./commands/stateMutate.js";
import { cmdTraceSnipe } from "./commands/traceSnipe.js";

const program = new Command();

program
  .name("lobster-cli")
  .description("LangGraph-focused CLI toolkit")
  .version("0.1.0");

program.addCommand(cmdInit());

const state = new Command("state").description("Durable execution state tools");
state.addCommand(cmdStateInspect());
state.addCommand(cmdStateRollback());
state.addCommand(cmdStateMutate());
program.addCommand(state);

const hitl = new Command("hitl").description("Human-in-the-loop tools");
hitl.addCommand(cmdHitlPending());
hitl.addCommand(cmdHitlResolve());
program.addCommand(hitl);

program.addCommand(cmdExport());

const graph = new Command("graph").description("Graph visualization tools");
graph.addCommand(cmdGraphRender());
program.addCommand(graph);

const chaos = new Command("chaos").description("Load/chaos tools");
chaos.addCommand(cmdChaosSpawn());
program.addCommand(chaos);

const trace = new Command("trace").description("Tracing tools (LangSmith stub)");
trace.addCommand(cmdTraceSnipe());
program.addCommand(trace);

program.parseAsync(process.argv);
