import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { Keypair } from "npm:@nillion/nuc@latest";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate a new Nillion keypair
    const keypair = Keypair.generate();
    
    const privateKey = keypair.privateKey();
    const did = keypair.toDid().toString();

    // Store keys in user profile
    await base44.asServiceRole.entities.User.update(user.id, {
      nillion_private_key: privateKey,
      nillion_did: did
    });

    return Response.json({
      success: true,
      privateKey,
      did,
      message: 'Nillion keys generated successfully!'
    });

  } catch (error) {
    console.error('generateNillionKeys error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});