import type { Metadata } from 'next'

type TGenerateMetadata = ({
  title,
  description,
  image,
  keywords
}: {
  title?: string
  description: string
  image?: string,
  keywords?: string
}) => Metadata

const generateMetadataUtil: TGenerateMetadata = ({
  title,
  description,
  image,
  keywords
}) => {
  return {
    title: title || 'BringID Platform',
    description,
    keywords,
    openGraph: {
      title: title || 'BringID Platform',
      images: [image || '/meta-image.png'],
      description,
      type: 'website'
    },
    twitter: {
      title: title || 'BringID Platform',
      images: [image || '/meta-image.png'],
      description,
      type: 'website',
      card: 'summary_large_image'
    }
  }
}

export default generateMetadataUtil