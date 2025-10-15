module.exports = async ({ github, context }) => {
  const repo = context.repo;
  const releasesList = await github.rest.repos.listReleases({
    owner: repo.owner,
    repo: repo.repo,
  });

  console.log(releasesList.data);
  return releasesList.data;
};
