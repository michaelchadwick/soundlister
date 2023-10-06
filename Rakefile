task :deploy do |t|
  sh "git push origin main"
  sh "rsync -auP --exclude-from='rsync-exclude.txt' . $SOUNDLISTER_REMOTE"
  sh "rsync -auP --exclude-from='rsync-exclude.txt' . $BITS_REMOTE"
  sh "rsync -auP --exclude-from='rsync-exclude.txt' . $ASPIRE_REMOTE"
end

task :default => [:deploy]
