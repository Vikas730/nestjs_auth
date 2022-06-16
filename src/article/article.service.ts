import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Article } from './interfaces/article.interface';
import { CreateArticleDto } from './dto/create-article.dto';

@Injectable()
export class ArticleService {
    constructor(
        @InjectModel('Article') private readonly articleModel: Model<Article>,
    ) { }

    // create Article

    async createArticle(createArticleDto: CreateArticleDto): Promise<Article> {
        const article = new this.articleModel(createArticleDto);
        await article.save();
        return article;
    }

    // get all article
    async getAllArticles(): Promise<any> {
        return await this.articleModel.find({});
    }

    // get one article
    async getOneArticle(id: string): Promise<Article> {
        return await this.articleModel.findById(id);
    }

    //update article  by id
    async updateArticlePut(id: string, createArticleDto: CreateArticleDto): Promise<Article> {
        return await this.articleModel.updateOne({_id: id}, createArticleDto);
    }

   // delete article by id
    async deleteArticle(id: string): Promise<Article> {
        return await this.articleModel.findByIdAndDelete(id);
    }
}
