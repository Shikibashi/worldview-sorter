import { readFile } from "node:fs/promises";
import { generatePilotPacket } from "../packages/runtime/index.js";

const root = new URL("../", import.meta.url);
const load = async (p) => JSON.parse(await readFile(new URL(p, root), "utf8"));

const args = process.argv.slice(2);
const getArg = (name, fallback = null) => {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : fallback;
};

const current = await load("data/current.json");
const pilot = await load(current.pilot.path);
const bank = await load(current.candidateBank.path);

const size = Number(getArg("--size", pilot.administration.defaultPacketSize));
const seed = getArg("--seed", "packet-0");
const packetId = getArg("--packet-id", `${pilot.pilotId}-${seed}`);

const packet = generatePilotPacket({ bank, pilot, seed, size, packetId });
process.stdout.write(JSON.stringify(packet, null, 2) + "\n");
