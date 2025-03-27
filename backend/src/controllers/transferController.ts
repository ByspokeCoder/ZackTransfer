import { Request, Response } from 'express';
import Transfer from '../models/Transfer';
import { generateCode } from '../utils/codeGenerator';
import { sendReadReceipt } from '../services/emailService';

export const createTransfer = async (req: Request, res: Response) => {
  try {
    const { content, type, email } = req.body;
    console.log('Creating transfer with email:', email);
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 60 * 1000); // 1 minute

    const transfer = new Transfer({
      code,
      content,
      type,
      expiresAt,
      senderEmail: email
    });

    await transfer.save();
    console.log('Transfer saved with email:', email);
    res.status(201).json({ code });
  } catch (error) {
    console.error('Error creating transfer:', error);
    res.status(500).json({ error: 'Failed to create transfer' });
  }
};

export const getTransfer = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const transfer = await Transfer.findOne({ code });

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    if (transfer.expiresAt < new Date()) {
      return res.status(410).json({ error: 'Transfer has expired' });
    }

    // Mark as read if not already read
    if (!transfer.isRead) {
      console.log('Marking transfer as read, email:', transfer.senderEmail);
      transfer.isRead = true;
      transfer.readAt = new Date();
      await transfer.save();
      
      // Send read receipt email
      try {
        console.log('Attempting to send read receipt to:', transfer.senderEmail);
        await sendReadReceipt(transfer);
        console.log('Read receipt sent successfully');
      } catch (emailError) {
        console.error('Error sending read receipt:', emailError);
      }
    }

    res.json(transfer);
  } catch (error) {
    console.error('Error retrieving transfer:', error);
    res.status(500).json({ error: 'Failed to retrieve transfer' });
  }
}; 