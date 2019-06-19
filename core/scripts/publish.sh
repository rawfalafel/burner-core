yarn version --no-git-tag-version &&
cp package.json src/ &&

pushd `pwd` && # store current dir
cd src &&

yarn publish --non-interactive --no-git-tag-version &&

popd # return to original dir
