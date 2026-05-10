// ============================================================
//  SP Studio — Vercel Deploy API Wrapper
//  apps/studio/src/lib/vercel-deploy.ts
//
//  Deploys a single HTML file as a static deployment to
//  [slug].strategypresentation.com via the Vercel Deploy API.
//  This is independent of Git — each strategy is a standalone deploy.
// ============================================================

const VERCEL_API = "https://api.vercel.com";

interface DeployResult {
  deploymentId: string;
  url: string; // canonical Vercel URL
  aliasUrl: string; // [slug].strategypresentation.com
}

/**
 * Deploy a strategy HTML file to [slug].strategypresentation.com
 * Uses the Vercel Files API + Deployments API.
 */
export async function deployStrategy(params: {
  slug: string;         // e.g. "abilitysc"
  html: string;         // full HTML content
  clientName: string;   // for deployment metadata
}): Promise<DeployResult> {
  const token = process.env.VERCEL_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID; // optional
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!token) throw new Error("VERCEL_TOKEN not set");
  if (!projectId) throw new Error("VERCEL_PROJECT_ID not set");

  const teamQuery = teamId ? `?teamId=${teamId}` : "";

  // ── Step 1: Upload file to Vercel file store ──────────────
  const encoder = new TextEncoder();
  const htmlBytes = encoder.encode(params.html);

  // Vercel expects SHA1 of the file content
  const sha1 = await computeSHA1(params.html);

  const uploadRes = await fetch(`${VERCEL_API}/v2/files${teamQuery}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/octet-stream",
      "x-vercel-digest": sha1,
      "Content-Length": String(htmlBytes.length),
    },
    body: htmlBytes,
  });

  // 200 = uploaded, 409 = already exists (both are fine)
  if (!uploadRes.ok && uploadRes.status !== 409) {
    const text = await uploadRes.text();
    throw new Error(`Vercel file upload failed: ${uploadRes.status} ${text}`);
  }

  // ── Step 2: Create deployment ─────────────────────────────
  const deploymentBody = {
    name: `sp-${params.slug}`,
    files: [
      {
        file: "index.html",
        sha: sha1,
        size: htmlBytes.length,
      },
    ],
    projectId,
    target: "production",
    meta: {
      clientName: params.clientName,
      clientSlug: params.slug,
      deployedBy: "sp-studio",
      deployedAt: new Date().toISOString(),
    },
    // Custom domain alias will be set in step 3
  };

  const deployRes = await fetch(`${VERCEL_API}/v13/deployments${teamQuery}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(deploymentBody),
  });

  if (!deployRes.ok) {
    const text = await deployRes.text();
    throw new Error(`Vercel deployment failed: ${deployRes.status} ${text}`);
  }

  const deployment = await deployRes.json();
  const deploymentId: string = deployment.id;
  const vercelUrl: string = `https://${deployment.url}`;

  // ── Step 3: Assign subdomain alias ────────────────────────
  const alias = `${params.slug}.strategypresentation.com`;

  const aliasRes = await fetch(
    `${VERCEL_API}/v2/deployments/${deploymentId}/aliases${teamQuery}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ alias }),
    }
  );

  if (!aliasRes.ok) {
    const text = await aliasRes.text();
    // Non-fatal: the deployment succeeded, just alias failed
    console.error(`Vercel alias assignment failed: ${aliasRes.status} ${text}`);
  }

  return {
    deploymentId,
    url: vercelUrl,
    aliasUrl: `https://${alias}`,
  };
}

/**
 * Delete a deployment (for cleanup / republish)
 */
export async function deleteDeployment(deploymentId: string): Promise<void> {
  const token = process.env.VERCEL_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  if (!token) return;

  const teamQuery = teamId ? `?teamId=${teamId}` : "";

  await fetch(`${VERCEL_API}/v13/deployments/${deploymentId}${teamQuery}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── SHA1 helper ───────────────────────────────────────────────
// Vercel requires SHA1 for file deduplication

async function computeSHA1(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
