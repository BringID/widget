type TMetadataArgs = {
  params: Promise<{ link_id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default TMetadataArgs