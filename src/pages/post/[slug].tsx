import { GetStaticPaths, GetStaticProps } from 'next';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { RichText } from 'prismic-dom';
import React from 'react';
import { FiClock, FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import Prismic from '@prismicio/client'
import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({post}: PostProps) {
  const { isFallback } = useRouter()

  if (isFallback) return (
    <span className={styles.loading}>Carregando...</span>
  )

  const postWordsCont = post.data.content.reduce((acc, content) => {
    const lengthHeader = content?.heading?.split(' ').length ?? 0
    const lengthBody = content?.body?.reduce((acc, body) => acc + body.text.split(' ').length, 0) ?? 0

    return acc + lengthHeader + lengthBody
  }, 0)
  const readingTime = Math.ceil(postWordsCont / 200)


  return (
    <>
      <img className={styles.banner} src={post.data.banner.url} alt="banner" />

      <main className={styles.container}>
        <h1>{post.data.title}</h1>
        <div>
          <time><FiCalendar />{
                  format(new Date(post.first_publication_date),'dd MMM yyyy' , {
                    locale: ptBR
                  })
                }</time>
          <span><FiUser />{post.data.author}</span>
          <span><FiClock />{readingTime} min</span>
        </div>
        <section className={styles.content}>
          {post.data.content.map((content => (
            <React.Fragment key={content.heading}>
              <h2>{content.heading}</h2>
              <div dangerouslySetInnerHTML={{__html: RichText.asHtml(content.body)}}></div>
            </ React.Fragment>
          )))}
        </section>
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([Prismic.Predicates.at('document.type', 'posts')])

  return {
    paths: posts.results.map(post => {return {params: {slug: post.uid}}}),
    fallback: true,
  }
};

export const getStaticProps: GetStaticProps = async ({params}) => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(params.slug), {});

  if (!response) {
    return {
      notFound: true
    }
  }

  return {
    props: {
      post: response
    },
    revalidate: 60 * 60 * 24 // 1day
  }
};
