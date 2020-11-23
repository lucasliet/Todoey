import { Request, Response } from 'express';
import { getRepository } from 'typeorm';

import jwt from 'jsonwebtoken';

import User from '../models/User';

export default {

  async login(request: Request, response: Response) {

    const userRepository = getRepository(User);

    const { email, password } = request.body;

    const user = await userRepository.findOne({ where: { email, password } });

    if (user) {

      const { id } = user;
      const token = jwt.sign({ id }, process.env.SECRET as string || 'vcnxzjgkherwioçgjawefkltçgn34uioqph', {
        expiresIn: 3000
      });

      return response.json({ auth: true, userId: id, token: token });
    }
    return response.status(500).json({ message: 'Invalid Login!' });

  }

}