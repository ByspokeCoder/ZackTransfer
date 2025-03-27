import { Request, Response } from 'express';
import Transfer from '../models/Transfer';
import { generateCode } from '../utils/codeGenerator';
import { sendReadReceipt } from '../services/emailService';

export const createTransfer = async (req: Request, res: Response) => {
  try {
    const { content, type, email } = req.body;
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
    res.status(201).json({ code });
  } catch (error) {
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
      transfer.isRead = true;
      transfer.readAt = new Date();
      await transfer.save();
      
      // Send read receipt email
      await sendReadReceipt(transfer);
    }

    res.json(transfer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve transfer' });
  }
}; 