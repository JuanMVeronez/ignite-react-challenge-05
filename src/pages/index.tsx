import { GetStaticProps, GetStaticPropsResult } from 'next';
import Prismic from '@prismicio/client';

import { FiCalendar, FiUser } from 'react-icons/fi'

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

import { getPrismicClient } from '../services/prismic';
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

export default function Home({ postsPagination, ...rest }: HomeProps): JSX.Element {
  console.log(postsPagination)


  return (
    <>
      <header>
        <img src="./assets/logo.svg" alt="" />
      </header>
      <main className={styles.container}>
        {postsPagination?.results?.map(post => (
          <a key={post.uid} href="#" className={styles.post}>
            <strong>{post.data.title}</strong>
            <p>{post.data.subtitle}</p>
            <div>
              <time>
                <FiCalendar />
                {post.first_publication_date}
              </time>
              <span>
                <FiUser />
                {post.data.author}
              </span>
            </div>
          </a>
        ))}
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

  const posts: Post[] = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: format(new Date(post.first_publication_date),'dd MMM yyyy' , {
        locale: ptBR
      }),
      data: post.data
    }
  })

  return {
    props: {
      postsPagination: {
        results: posts,
        next_page: postsResponse.next_page
      }
    },
    revalidate: 60 * 60 * 24 // 1day
  }
};
