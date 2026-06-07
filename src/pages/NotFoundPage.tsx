type NotFoundPageProps = {
  preview?: boolean;
};

export function NotFoundPage({ preview = false }: NotFoundPageProps) {
  return (
    <main id="main-content" className="not-found">
      <p className="section-label">404</p>
      <h1>{preview ? "找不到这个预览" : "找不到这个页面"}</h1>
      <p>链接可能已更新，或者页面还没有发布。</p>
      <a className="button button--primary" href="/">
        返回首页
      </a>
    </main>
  );
}
