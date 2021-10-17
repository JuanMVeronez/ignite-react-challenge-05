import { GetStaticProps, GetStaticPropsResult } from 'next';
import Link from 'next/link'

import Prismic from '@prismicio/client';

import { FiCalendar, FiUser } from 'react-icons/fi'

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

import { getPrismicClient } from '../services/prismic';
import { useState } from 'react';
interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [{results: posts, next_page}, setCurrentPostsPagination] = useState<PostPagination>(postsPagination)

  async function handleLoadMore() {
    fetch(next_page)
      .then(res => res.json())
      .then((data: PostPagination) => {
        setCurrentPostsPagination({
          next_page: data.next_page,
          results: [...posts, ...data.results],
        })
      })
  }

  return (
    <>
      <main className={styles.container}>
        {posts.map(post => (
          <Link key={post.uid} href={`/post/${post.uid}`}>
            <a className={styles.post}>
              <strong>{post.data.title}</strong>
              <p>{post.data.subtitle}</p>
              <div>
                <time><FiCalendar />{
                  format(new Date(post.first_publication_date),'dd MMM yyyy' , {
                    locale: ptBR
                  })
                }</time>
                <span><FiUser />{post.data.author}</span>
              </div>
            </a>
          </Link>
        ))}
        {next_page && (
          <button
            className={styles.loadPostsButton}
            onClick={handleLoadMore}
          >Carregar mais posts</button>
        )}
      </main>
    </>
  );
}

type GetStaticPropsHomeResult = {
  postsPagination: PostPagination;
}

export const getStaticProps: GetStaticProps = async (): Promise<GetStaticPropsResult<GetStaticPropsHomeResult>> => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 2
    });

  return {
    props: {
      postsPagination: {
        results: postsResponse.results,
        next_page: postsResponse.next_page
      }
    },
    revalidate: 60 * 60 * 24 // 1day
  }
};
