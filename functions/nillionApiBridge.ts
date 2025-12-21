import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  console.log('=== nillionApiBridge started ===');
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, data: requestData } = body;
    console.log('Action:', action);

    // Helper: Derive encryption key from password
    const deriveKey = async (password, salt) => {
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      return await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    };

    // Helper: Encrypt data
    const encryptData = async (data, password) => {
      const encoder = new TextEncoder();
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const key = await deriveKey(password, salt);
      
      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encoder.encode(data)
      );

      return {
        encrypted: Array.from(new Uint8Array(encryptedData)).map(b => b.toString(16).padStart(2, '0')).join(''),
        iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
        salt: Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
      };
    };

    // Helper: Decrypt data
    const decryptData = async (encryptedHex, ivHex, saltHex, password) => {
      const encrypted = new Uint8Array(encryptedHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      const iv = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      
      const key = await deriveKey(password, salt);
      
      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    };

    switch (action) {
      case 'list_stores': {
        console.log('Listing stores for user:', user.email);
        
        try {
          const stores = await base44.entities.NillionData.filter({ 
            user_email: user.email 
          });
          
          console.log('Found', stores.length, 'records');
          
          return Response.json({
            success: true,
            stores: stores.map(s => ({
              id: s.secret_id || s.id,
              name: `Private Data - ${s.created_date ? new Date(s.created_date).toLocaleDateString() : 'Unknown'}`,
              created_at: s.created_date
            })),
            note: 'Using local encryption. Nillion network integration pending subscription renewal.'
          });
        } catch (error) {
          console.error('Error listing stores:', error);
          return Response.json({
            success: false,
            error: 'Failed to list stores',
            details: error.message
          }, { status: 500 });
        }
      }

      case 'store_private_data': {
        const { privateData, retrievalPassword } = requestData || {};
        
        if (!privateData || !retrievalPassword) {
          return Response.json({ 
            success: false,
            error: 'Private data and retrieval password are required' 
          }, { status: 400 });
        }

        console.log('Storing private data...');

        try {
          const { encrypted, iv, salt } = await encryptData(privateData, retrievalPassword);
          const secretId = crypto.randomUUID();

          await base44.entities.NillionData.create({
            user_email: user.email,
            store_id: 'local-encrypted',
            secret_id: secretId,
            encrypted_data: encrypted,
            iv: iv,
            salt: salt
          });

          console.log('Data stored successfully');

          return Response.json({
            success: true,
            record_id: secretId,
            message: 'Private data stored securely (local encryption)'
          });

        } catch (error) {
          console.error('Error storing data:', error);
          return Response.json({
            success: false,
            error: 'Failed to store private data',
            details: error.message
          }, { status: 500 });
        }
      }

      case 'retrieve_private_data': {
        const { storeId, retrievalPassword } = requestData || {};
        
        if (!storeId || !retrievalPassword) {
          return Response.json({ 
            success: false,
            error: 'Store ID and retrieval password are required' 
          }, { status: 400 });
        }

        console.log('Retrieving data...');

        try {
          const records = await base44.entities.NillionData.filter({
            user_email: user.email,
            secret_id: storeId
          });

          if (records.length === 0) {
            return Response.json({ 
              success: false,
              error: 'Record not found' 
            }, { status: 404 });
          }

          const record = records[0];
          
          try {
            const decrypted = await decryptData(
              record.encrypted_data,
              record.iv,
              record.salt,
              retrievalPassword
            );

            console.log('Data retrieved successfully');

            return Response.json({
              success: true,
              data: decrypted,
              message: 'Private data retrieved successfully'
            });
          } catch (decryptError) {
            console.error('Decryption failed:', decryptError);
            return Response.json({
              success: false,
              error: 'Failed to decrypt data. Incorrect password or corrupted data.'
            }, { status: 400 });
          }

        } catch (error) {
          console.error('Error retrieving data:', error);
          return Response.json({
            success: false,
            error: 'Failed to retrieve data',
            details: error.message
          }, { status: 500 });
        }
      }

      case 'delete_private_data': {
        const { storeId } = requestData || {};
        
        if (!storeId) {
          return Response.json({ 
            success: false,
            error: 'Store ID is required' 
          }, { status: 400 });
        }

        console.log('Deleting data...');

        try {
          const records = await base44.entities.NillionData.filter({
            user_email: user.email,
            secret_id: storeId
          });

          if (records.length === 0) {
            return Response.json({ 
              success: false,
              error: 'Record not found' 
            }, { status: 404 });
          }

          await base44.entities.NillionData.delete(records[0].id);

          console.log('Data deleted successfully');

          return Response.json({
            success: true,
            message: 'Private data deleted successfully'
          });

        } catch (error) {
          console.error('Error deleting data:', error);
          return Response.json({
            success: false,
            error: 'Failed to delete data',
            details: error.message
          }, { status: 500 });
        }
      }

      default:
        return Response.json({
          success: false,
          error: 'Unknown action: ' + action
        }, { status: 400 });
    }

  } catch (error) {
    console.error('=== CRITICAL ERROR ===');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    return Response.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
});