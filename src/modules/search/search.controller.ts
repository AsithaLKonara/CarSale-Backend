import { Request, Response, NextFunction } from 'express';
import { executeGlobalSearch } from './search.service';

export const getSearchResults = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query.q as string;
    const results = await executeGlobalSearch(query);

    res.status(200).json({
      status: 'success',
      data: results,
    });
  } catch (error) {
    next(error);
  }
};
