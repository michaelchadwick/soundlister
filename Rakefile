task :deploy do # rubocop:disable Style/FrozenStringLiteralComment
  sh 'git push origin main'
  sh "rsync -auP --no-p --exclude-from='rsync-exclude.txt' . $SOUNDLISTER_REMOTE"
  sh "rsync -auP --no-p --exclude-from='rsync-exclude.txt' . $BITS_REMOTE"
  sh "rsync -auP --no-p --exclude-from='rsync-exclude.txt' . $SATCH20_REMOTE"
end

task default: [:deploy]
